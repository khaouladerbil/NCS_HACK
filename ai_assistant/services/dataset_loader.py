import json
from pathlib import Path

from django.conf import settings
from django.db import transaction

from ai_assistant.models import LegalChunk, LegalSource

from .chunking import chunk_text, detect_article
from .embeddings import get_embedder


DATASET_PATH = Path(settings.BASE_DIR) / "ai_assistant" / "data" / "legal_dataset.json"


def load_legal_dataset(path=DATASET_PATH):
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    records = payload.get("sources", payload if isinstance(payload, list) else [])
    embedder = get_embedder()
    imported = 0

    with transaction.atomic():
        for record in records:
            source, _ = LegalSource.objects.update_or_create(
                title=record["title"],
                defaults={
                    "source_type": record.get("source_type", "law"),
                    "jurisdiction": record.get("jurisdiction", "Algeria"),
                    "category": record.get("category", ""),
                    "reference": record.get("reference", ""),
                    "language": record.get("language", "fr"),
                    "metadata": record.get("metadata", {}),
                },
            )
            source.chunks.all().delete()

            source_chunks = record.get("chunks")
            if not source_chunks:
                source_chunks = chunk_text(record.get("text", ""))

            for index, chunk in enumerate(source_chunks):
                text = chunk["text"] if isinstance(chunk, dict) else chunk
                LegalChunk.objects.create(
                    source=source,
                    chunk_index=index,
                    text=text,
                    article=(chunk.get("article") if isinstance(chunk, dict) else "") or detect_article(text),
                    section=(chunk.get("section") if isinstance(chunk, dict) else ""),
                    embedding=embedder.embed_passage(text),
                    metadata=chunk.get("metadata", {}) if isinstance(chunk, dict) else {},
                )
                imported += 1

    return imported
