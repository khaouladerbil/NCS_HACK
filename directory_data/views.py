import math

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import LawyerProfile
from .serializers import LawyerMapSerializer


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


class LawyerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LawyerProfile.objects.select_related("address").all()
    serializer_class = LawyerMapSerializer

    @action(detail=False, methods=["get"], url_path="nearest")
    def nearest(self, request):
        try:
            user_lat = float(request.query_params["lat"])
            user_lon = float(request.query_params["lon"])
        except (KeyError, ValueError):
            return Response(
                {"error": "lat and lon query parameters are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            limit = max(1, min(int(request.query_params.get("limit", 5)), 50))
        except ValueError:
            limit = 5

        specialization = request.query_params.get("specialization", "").strip().lower()

        lawyers = LawyerProfile.objects.select_related("address").filter(
            approved=True,
            address__latitude__isnull=False,
            address__longitude__isnull=False,
        )

        results = []
        for lawyer in lawyers:
            if specialization and specialization not in lawyer.specialization.lower():
                continue
            addr = lawyer.address
            dist = haversine_km(
                user_lat, user_lon,
                float(addr.latitude), float(addr.longitude),
            )
            results.append((dist, lawyer))

        results.sort(key=lambda x: x[0])

        data = []
        for dist, lawyer in results[:limit]:
            entry = LawyerMapSerializer(lawyer).data
            entry["distance_km"] = round(dist, 2)
            data.append(entry)

        return Response(data)
