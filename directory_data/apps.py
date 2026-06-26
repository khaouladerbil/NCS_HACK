from django.apps import AppConfig


class DirectoryDataConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "directory_data"
    verbose_name = "Lawyer Directory (read-only)"
