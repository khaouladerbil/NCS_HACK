from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static



urlpatterns = [
    path("admin/", admin.site.urls),

    path(
        "api/auth/",
        include("users.urls")
    ),
    
    path(
        "api/legal/",
        include("legal_twin.urls")
    ),
    
       
       
    path("api/legal-path/", include("legal_path.urls")),


]
urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT
)