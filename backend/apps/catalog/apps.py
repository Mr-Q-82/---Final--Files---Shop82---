from django.apps import AppConfig


class CatalogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.catalog"

    def ready(self):
        # Register lightweight domain hooks after Django has loaded every model.
        from . import signals  # noqa: F401
