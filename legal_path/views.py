import json
from django.shortcuts import render

from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from directory_data.serializers import LawyerMapSerializer

from .models import (
    LegalRequest,
    AIAnalysis,
    RoadmapStep,
    RequiredDocument,
    Recommendation,
    TimelineEvent,
)
from .serializers import (
    LegalRequestSerializer,
    AIAnalysisSerializer,
    RoadmapStepSerializer,
    RequiredDocumentSerializer,
    RecommendationSerializer,
    TimelineEventSerializer,
)
from .permissions import IsOwner
from .services.lawyer_recommendation_service import LawyerRecommendationService
from .services.geocoding_service import geocode


class LegalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LegalRequestSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return LegalRequest.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["get"])
    def recommended_lawyers(self, request, pk=None):
        legal_request = self.get_object()
        wilaya = request.query_params.get("wilaya")
        q = request.query_params.get("q")
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")

        if not lat and not lng and q:
            coords = geocode(q)
            if coords:
                lat, lng = str(coords[0]), str(coords[1])

        results = LawyerRecommendationService.recommend(
            user=request.user,
            category=legal_request.category,
            user_wilaya=wilaya,
            lat=lat,
            lng=lng,
        )
        serializer = LawyerMapSerializer(
            [r["lawyer"] for r in results], many=True, context={"request": request}
        )
        enriched = []
        for data, result in zip(serializer.data, results):
            data["match_reason"] = result["match_reason"]
            data["is_same_wilaya"] = result["is_same_wilaya"]
            data["distance_km"] = result["distance_km"]
            data["specializations"] = result["specializations"]
            enriched.append(data)
        return Response(enriched)


class NestedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwner]
    parent_model = LegalRequest
    parent_field = "legal_request"

    def get_queryset(self):
        return self.queryset.filter(
            **{
                f"{self.parent_field}_id": self.kwargs["legal_request_pk"],
                f"{self.parent_field}__user": self.request.user,
            }
        )

    def perform_create(self, serializer):
        serializer.save(
            **{
                f"{self.parent_field}_id": self.kwargs["legal_request_pk"],
            }
        )


class AIAnalysisViewSet(NestedViewSet):
    serializer_class = AIAnalysisSerializer
    queryset = AIAnalysis.objects.all()


class RoadmapStepViewSet(NestedViewSet):
    serializer_class = RoadmapStepSerializer
    queryset = RoadmapStep.objects.all()


class RequiredDocumentViewSet(NestedViewSet):
    serializer_class = RequiredDocumentSerializer
    queryset = RequiredDocument.objects.all()


class RecommendationViewSet(NestedViewSet):
    serializer_class = RecommendationSerializer
    queryset = Recommendation.objects.all()


class TimelineEventViewSet(NestedViewSet):
    serializer_class = TimelineEventSerializer
    queryset = TimelineEvent.objects.all()


class AnalyzeLegalCaseView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get("message", "")
        if not message:
            return Response({"error": "message requis"}, status=400)
        try:
            lat = float(request.data["lat"]) if request.data.get("lat") else None
            lon = float(request.data["lon"]) if request.data.get("lon") else None
        except (ValueError, TypeError):
            lat, lon = None, None

        from .services.analyze_service import build_analyze_response
        result = build_analyze_response(message, lat=lat, lon=lon)
        return Response(result)


def lawyer_map_view(request, request_id):
    from .services.lawyer_recommendation_service import WILAYA_COORDS
    from legal_twin.models import CitizenProfile

    user_wilaya = ""
    coords = None
    try:
        profile = request.user.citizen_profile
        user_wilaya = profile.wilaya
        c = WILAYA_COORDS.get(profile.wilaya)
        if c:
            coords = list(c)
    except CitizenProfile.DoesNotExist:
        pass

    return render(request, "legal_path/lawyer_map.html", {
        "request_id": request_id,
        "user_wilaya": user_wilaya,
        "user_coords": json.dumps(coords),
    })
