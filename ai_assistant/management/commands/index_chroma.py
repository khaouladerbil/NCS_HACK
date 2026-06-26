# ai_assistant/management/commands/index_chroma.py
import time
from pathlib import Path

from django.core.management.base import BaseCommand

from ai_assistant.services.chroma_client import get_chroma_client, get_collection, CHROMA_PATH
from ai_assistant.services.embeddings import get_embedder
from ai_assistant.models import LegalSource, LegalChunk
import json

DEFAULT_DATASET_PATH = r"C:\Users\HP\Desktop\jurididAI\NCS_HACK\ai_assistant\data\legal_dataset.json"


class Command(BaseCommand):
    help = "Indexe le dataset juridique (lois/articles) dans ChromaDB avec suivi detaille."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            default=DEFAULT_DATASET_PATH,
            help="Chemin vers le fichier JSON du dataset.",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=16,
            help="Nombre de chunks embeddes par lot avant upsert dans Chroma.",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Vide entierement la collection 'legal_chunks' avant de reindexer.",
        )
        parser.add_argument(
            "--lang",
            default="fr",
            choices=["fr", "ar", "en", "darija"],
            help="Langue principale utilisee pour le texte embedde (fallback automatique si vide).",
        )

    def handle(self, *args, **options):
        path = Path(options["path"])
        batch_size = options["batch_size"]
        primary_lang = options["lang"]

        self.stdout.write(self.style.NOTICE("=" * 70))
        self.stdout.write(self.style.NOTICE("INDEXATION CHROMADB"))
        self.stdout.write(self.style.NOTICE("=" * 70))
        self.stdout.write(f"Dataset source   : {path}")
        self.stdout.write(f"Chroma persist   : {CHROMA_PATH}")
        self.stdout.write(f"Batch size       : {batch_size}")
        self.stdout.write(f"Langue principale: {primary_lang}")
        self.stdout.write("")

        if not path.exists():
            self.stderr.write(self.style.ERROR(f"Fichier introuvable: {path}"))
            return

        client = get_chroma_client()
        existing = [c.name for c in client.list_collections()]
        self.stdout.write(f"Collections existantes avant run : {existing or '(aucune)'}")

        collection = get_collection("legal_chunks")

        if options["reset"]:
            count_before = collection.count()
            self.stdout.write(self.style.WARNING(
                f"--reset: suppression de {count_before} vecteurs existants dans 'legal_chunks'"
            ))
            all_ids = collection.get()["ids"]
            if all_ids:
                collection.delete(ids=all_ids)

        self.stdout.write(f"Vecteurs dans 'legal_chunks' avant import : {collection.count()}")
        self.stdout.write("")

        payload = json.loads(path.read_text(encoding="utf-8"))
        records = payload if isinstance(payload, list) else payload.get("sources", [])

        self.stdout.write(f"Lois trouvees dans le dataset : {len(records)}")
        if records:
            self.stdout.write(f"Cles du premier enregistrement : {list(records[0].keys())}")
        self.stdout.write("")

        embedder = get_embedder()

        total_imported = 0
        total_skipped = 0
        start_time = time.time()
        fallback_order = [primary_lang, "fr", "en", "ar", "darija"]

        for i, record in enumerate(records, start=1):
            law_id = record.get("law_id", f"<loi #{i}>")
            metadata = record.get("metadata", {}) or {}
            source_title = record.get("source_file") or law_id
            t0 = time.time()

            source, created = LegalSource.objects.update_or_create(
                title=source_title,
                defaults={
                    "source_type": metadata.get("law_type", "law") or "law",
                    "jurisdiction": "Algeria",
                    "category": metadata.get("category", "") or "",
                    "reference": metadata.get("law_number", "") or "",
                    "language": primary_lang,
                    "metadata": {
                        "law_id": law_id,
                        "law_date": metadata.get("law_date", ""),
                        **metadata,
                    },
                },
            )
            status_label = "CREEE" if created else "MAJ"

            source.chunks.all().delete()
            collection.delete(where={"source_id": source.id})

            articles = record.get("articles", [])
            if not articles:
                self.stdout.write(self.style.WARNING(
                    f"[{i}/{len(records)}] {status_label} '{source_title}' -> 0 article, ignore"
                ))
                total_skipped += 1
                continue

            ids, documents, metadatas = [], [], []

            for index, article in enumerate(articles):
                text = ""
                used_lang = ""
                for lang in fallback_order:
                    candidate = (article.get(lang) or "").strip()
                    if candidate:
                        text = candidate
                        used_lang = lang
                        break

                if not text:
                    continue

                article_number = article.get("article_number", "") or ""
                chunk_id_str = article.get("chunk_id", f"{law_id}_{index}")

                db_chunk = LegalChunk.objects.create(
                    source=source,
                    chunk_index=index,
                    text=text,
                    article=article_number,
                    section="",
                    embedding=[],
                    metadata={
                        "chunk_id_original": chunk_id_str,
                        "language_used": used_lang,
                        "keywords": article.get("keywords", []),
                        "summary": article.get("summary", ""),
                        "status": article.get("status", ""),
                    },
                )

                ids.append(f"legal_{db_chunk.id}")
                documents.append(text)
                metadatas.append({
                    "chunk_id": db_chunk.id,
                    "source_id": source.id,
                    "source_title": source.title,
                    "reference": source.reference or "",
                    "article": article_number,
                    "section": "",
                    "language": used_lang,
                    "law_id": law_id,
                })

            if not ids:
                self.stdout.write(self.style.WARNING(
                    f"[{i}/{len(records)}] {status_label} '{source_title}' -> 0 article avec texte exploitable, ignore"
                ))
                total_skipped += 1
                continue

            for start in range(0, len(ids), batch_size):
                end = min(start + batch_size, len(ids))
                batch_texts = documents[start:end]
                batch_embeddings = [embedder.embed_passage(t) for t in batch_texts]

                collection.upsert(
                    ids=ids[start:end],
                    embeddings=batch_embeddings,
                    documents=batch_texts,
                    metadatas=metadatas[start:end],
                )
                self.stdout.write(f"    -> lot {start}-{end}/{len(ids)} embeddes et upsertes")

            elapsed = time.time() - t0
            total_imported += len(ids)
            self.stdout.write(self.style.SUCCESS(
                f"[{i}/{len(records)}] {status_label} '{source_title}' "
                f"-> {len(ids)} articles indexes en {elapsed:.1f}s"
            ))

        total_elapsed = time.time() - start_time
        self.stdout.write("")
        self.stdout.write(self.style.NOTICE("=" * 70))
        self.stdout.write(self.style.SUCCESS(f"Termine en {total_elapsed:.1f}s"))
        self.stdout.write(f"Articles importes : {total_imported}")
        self.stdout.write(f"Lois ignorees     : {total_skipped}")
        self.stdout.write(f"Vecteurs totaux dans 'legal_chunks' (apres import) : {collection.count()}")
        self.stdout.write(f"Emplacement disque Chroma : {CHROMA_PATH}")
        self.stdout.write(self.style.NOTICE("=" * 70))