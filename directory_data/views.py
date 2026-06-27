import math

from rest_framework import viewsets
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
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class LawyerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LawyerProfile.objects.select_related("address").all()
    serializer_class = LawyerMapSerializer

    @action(detail=False, methods=["get"], url_path="nearest")
    def nearest(self, request):
        try:
            lat = float(request.query_params["lat"])
            lon = float(request.query_params["lon"])
        except (KeyError, ValueError):
            return Response({"error": "lat et lon requis"}, status=400)

        limit = int(request.query_params.get("limit", 5))
        specialty = request.query_params.get("specialty", "").lower()

        lawyers = LawyerProfile.objects.select_related("address").filter(
            approved=True,
            address__latitude__isnull=False,
            address__longitude__isnull=False,
        )
        if specialty:
            lawyers = lawyers.filter(specialization__icontains=specialty)

        results = []
        for lawyer in lawyers:
            addr = lawyer.address
            dist = haversine_km(lat, lon, float(addr.latitude), float(addr.longitude))
            results.append((dist, lawyer))

        results.sort(key=lambda x: x[0])
        nearest = [lawyer for _, lawyer in results[:limit]]

        serializer = self.get_serializer(nearest, many=True)
        data = []
        for item, (dist, _) in zip(serializer.data, results[:limit]):
            entry = dict(item)
            entry["distance_km"] = round(dist, 1)
            data.append(entry)

        return Response(data)
