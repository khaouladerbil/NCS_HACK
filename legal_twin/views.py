from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser


from .models import *
from .serializers import *
class ProfileView(
    generics.RetrieveUpdateAPIView,
    generics.CreateAPIView
):

    serializer_class = CitizenProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.citizen_profile

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DocumentListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = CitizenDocumentSerializer
    permission_classes = [IsAuthenticated]

    parser_classes = (
        MultiPartParser,
        FormParser,
    )

    def get_queryset(self):
        return CitizenDocument.objects.filter(
            profile=self.request.user.citizen_profile
        )

    def perform_create(self, serializer):
        serializer.save(
            profile=self.request.user.citizen_profile
        )


class DocumentDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = CitizenDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CitizenDocument.objects.filter(
            profile=self.request.user.citizen_profile
        )
class CaseListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = CitizenCaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CitizenCase.objects.filter(
            profile=self.request.user.citizen_profile
        )

    def perform_create(self, serializer):
        serializer.save(
            profile=self.request.user.citizen_profile
        )

class DeadlineListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = LegalDeadlineSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LegalDeadline.objects.filter(
            profile=self.request.user.citizen_profile
        )

    def perform_create(self, serializer):
        serializer.save(
            profile=self.request.user.citizen_profile
        )