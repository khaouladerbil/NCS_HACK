from django.urls import path

from .views import (
    ProfileView,
    DocumentListCreateView,
    DocumentDetailView,
    CaseListCreateView,
    DeadlineListCreateView,
)

urlpatterns = [

    path(
        "profile/",
        ProfileView.as_view(),
        name="profile"
    ),

    path(
        "documents/",
        DocumentListCreateView.as_view(),
        name="documents"
    ),
    path(
        "documents/<int:pk>/",
        DocumentDetailView.as_view()
    ),

    path(
        "cases/",
        CaseListCreateView.as_view(),
        name="cases"
    ),

    path(
        "deadlines/",
        DeadlineListCreateView.as_view(),
        name="deadlines"
    ),
]