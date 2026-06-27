from django.apps import AppConfig


class AiAssistantConfig(AppConfig):
    name = "ai_assistant"

    def ready(self):
        import threading

        def _preload():
            try:
                from .services.embeddings import get_embedder
                get_embedder()
            except Exception:
                pass

        t = threading.Thread(target=_preload, daemon=True)
        t.start()
