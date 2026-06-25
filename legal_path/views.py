from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import LegalRequest
from .serializers import LegalRequestSerializer
from .permissions import IsOwner


class LegalRequestViewSet(viewsets.ModelViewSet):

    serializer_class = LegalRequestSerializer

    permission_classes = [
        IsAuthenticated,
        IsOwner,
    ]

    def get_queryset(self):

        return LegalRequest.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )