from ai_assistant.models import AssistantDocumentChunk

from .chunking import chunk_text
from .embeddings import get_embedder
from .text_extraction import extract_text_from_file


def index_assistant_document(document):
    text = extract_text_from_file(document.file)
    document.extracted_text = text
    document.save(update_fields=["extracted_text", "updated_at"])

    document.chunks.all().delete()
    embedder = get_embedder()
    chunks = chunk_text(text)
    for index, chunk in enumerate(chunks):
        AssistantDocumentChunk.objects.create(
            document=document,
            chunk_index=index,
            text=chunk,
            embedding=embedder.embed_passage(chunk),
        )
    return len(chunks)
