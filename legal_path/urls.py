from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import LegalRequestViewSet

router = DefaultRouter()
router.register(
    r"requests",
    LegalRequestViewSet,
    basename="legal-request"
)

urlpatterns = [
    path("", include(router.urls)),
]