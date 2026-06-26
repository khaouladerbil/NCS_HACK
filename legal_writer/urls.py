from django.urls import path

from .views import (
    TemplateListView,
    DocumentListCreateView,
    DocumentDetailView,
    DocumentGenerateView,
    DocumentExportView,
    DocumentVersionListView,
    DocumentVersionDetailView,
)

urlpatterns = [
    path("templates/", TemplateListView.as_view(), name="templates"),
    path("documents/", DocumentListCreateView.as_view(), name="documents"),
    path("documents/<int:pk>/", DocumentDetailView.as_view(), name="document-detail"),
    path("documents/<int:pk>/generate/", DocumentGenerateView.as_view(), name="document-generate"),
    path("documents/<int:pk>/download/", DocumentExportView.as_view(), name="document-download"),
    path("documents/<int:document_pk>/versions/", DocumentVersionListView.as_view(), name="document-versions"),
    path("versions/<int:pk>/", DocumentVersionDetailView.as_view(), name="version-detail"),
]
