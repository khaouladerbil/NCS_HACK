import os
import chromadb
from django.conf import settings

_CLIENT = None
_COLLECTIONS = {}

CHROMA_PATH = getattr(
    settings,
    "CHROMA_PERSIST_DIR",
    os.path.join(settings.BASE_DIR, "chroma_data"),
)


def get_chroma_client():
    global _CLIENT
    if _CLIENT is None:
        os.makedirs(CHROMA_PATH, exist_ok=True)
        _CLIENT = chromadb.PersistentClient(path=str(CHROMA_PATH))
    return _CLIENT


def get_collection(name):
    if name not in _COLLECTIONS:
        client = get_chroma_client()
        _COLLECTIONS[name] = client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )
    return _COLLECTIONS[name]