from rest_framework import viewsets

from .models import LawyerProfile
from .serializers import LawyerMapSerializer


class LawyerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LawyerProfile.objects.select_related("address").all()
    serializer_class = LawyerMapSerializer
