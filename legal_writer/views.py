from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse

from .models import DocumentTemplate, LegalDocument, DocumentVersion
from .serializers import (
    DocumentTemplateSerializer,
    LegalDocumentSerializer,
    LegalDocumentGenerateSerializer,
    DocumentVersionSerializer,
)
from .permissions import IsOwner
from .services.export_service import ExportService


class TemplateListView(generics.ListAPIView):
    queryset = DocumentTemplate.objects.filter(is_active=True)
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated]


class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = LegalDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LegalDocument.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LegalDocumentSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return LegalDocument.objects.filter(user=self.request.user)


class DocumentGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            document = LegalDocument.objects.get(pk=pk, user=request.user)
        except LegalDocument.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = LegalDocumentGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        input_text = serializer.validated_data["input_text"]

        from .services.writer_service import generate_document
        result = generate_document(document, input_text)

        version = DocumentVersion.objects.filter(document=document).count() + 1
        DocumentVersion.objects.create(
            document=document,
            content=result["content"],
            version=version,
        )

        document.content = result["content"]
        document.status = "generated"
        document.save(update_fields=["content", "status", "updated_at"])

        return Response(LegalDocumentSerializer(document, context={"request": request}).data)


class DocumentVersionListView(generics.ListAPIView):
    serializer_class = DocumentVersionSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return DocumentVersion.objects.filter(
            document_id=self.kwargs["document_pk"],
            document__user=self.request.user,
        )


class DocumentVersionDetailView(generics.RetrieveAPIView):
    serializer_class = DocumentVersionSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return DocumentVersion.objects.filter(
            document__user=self.request.user,
        )


class DocumentExportView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def get(self, request, pk):
        try:
            document = LegalDocument.objects.get(pk=pk, user=request.user)
        except LegalDocument.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        pdf_bytes = ExportService.export_pdf(document)

        filename = f"{document.title.replace(' ', '_')}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Content-Length"] = len(pdf_bytes)
        return response
