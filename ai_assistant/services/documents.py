from django.db import transaction

from ai_assistant.models import AssistantDocumentChunk

from .chunking import chunk_text
from .embeddings import get_embedder
from .text_extraction import extract_text_from_file


def index_assistant_document(document):
    text = extract_text_from_file(document.file)
    document.extracted_text = text
    document.save(update_fields=["extracted_text", "updated_at"])

    embedder = get_embedder()
    if embedder is None:
        raise RuntimeError("Embedding service unavailable for document indexing.")

    chunks = chunk_text(text)
    prepared_chunks = []
    for index, chunk in enumerate(chunks):
        prepared_chunks.append(
            AssistantDocumentChunk(
                document=document,
                chunk_index=index,
                text=chunk,
                embedding=embedder.embed_passage(chunk),
            )
        )

    with transaction.atomic():
        document.chunks.all().delete()
        AssistantDocumentChunk.objects.bulk_create(prepared_chunks)
    return len(chunks)
