import json
import time
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from ai_assistant.management.commands.test_real_questions import REAL_QUESTIONS
from ai_assistant.services.chroma_client import get_collection
from ai_assistant.services.embeddings import EmbeddingUnavailableError, get_embedder
from ai_assistant.services.query_enrichment import normalize_for_search
from ai_assistant.services.retrieval import RAG_MIN_SCORE, format_context, retrieve_context


User = get_user_model()
REPORT_PATH = Path(__file__).resolve().parent / "rag_quality_diagnostic_report.json"


def _keyword_hit(expected_keywords, texts):
    if not expected_keywords:
        return None
    blob = normalize_for_search(" ".join(texts))
    return any(normalize_for_search(keyword) in blob for keyword in expected_keywords)


def _top1_score(results):
    return round(results[0]["score"], 4) if results else 0.0


def _avg_ms(latencies):
    return round((sum(latencies) / len(latencies)) * 1000, 2) if latencies else 0.0


def _rate(count, total):
    return round(count / total, 4) if total else None


def _compact_citation(item):
    citation = item.get("citation", {})
    return {
        "source": citation.get("source") or citation.get("document") or "",
        "article": citation.get("article", ""),
        "chunk_id": citation.get("chunk_id"),
    }


def _diagnose_case(is_distractor, chroma_hit, pipeline_hit, chroma_has, pipeline_has):
    if is_distractor:
        if pipeline_has:
            return "pipeline_false_positive"
        if chroma_has:
            return "chroma_false_positive_filtered_by_pipeline"
        return "distractor_rejected"

    if chroma_hit and pipeline_hit:
        return "both_ok"
    if not chroma_hit and pipeline_hit:
        return "pipeline_improved_chroma"
    if chroma_hit and not pipeline_hit:
        return "pipeline_regression"
    if not chroma_has and not pipeline_has:
        return "no_retrieval_dataset_or_index_gap"
    if chroma_has and not pipeline_has:
        return "pipeline_threshold_or_rerank_issue"
    if pipeline_has and not pipeline_hit:
        return "pipeline_returns_irrelevant_context"
    return "both_irrelevant_or_keywords_missing"


class Command(BaseCommand):
    help = "Diagnostique la qualite de ChromaDB brut vs le pipeline RAG complet."

    def add_arguments(self, parser):
        parser.add_argument("--top-k", type=int, default=5)
        parser.add_argument("--report", default=str(REPORT_PATH))
        parser.add_argument("--category", default=None)
        parser.add_argument("--verbose", action="store_true")

    def handle(self, *args, **options):
        top_k = options["top_k"]
        report_path = Path(options["report"])
        category_filter = options["category"]
        verbose = options["verbose"]

        questions = REAL_QUESTIONS
        if category_filter:
            questions = [q for q in questions if q["category"] == category_filter]

        collection = get_collection("legal_chunks")
        total_vectors = collection.count()
        embedder = get_embedder()

        self.stdout.write(self.style.NOTICE("=" * 70))
        self.stdout.write(self.style.NOTICE("DIAGNOSTIC QUALITE RAG"))
        self.stdout.write(self.style.NOTICE("=" * 70))
        self.stdout.write(f"Questions testees      : {len(questions)}")
        self.stdout.write(f"Top-K                  : {top_k}")
        self.stdout.write(f"Vecteurs ChromaDB      : {total_vectors}")
        self.stdout.write(f"Embedding disponible   : {'oui' if embedder else 'non'}")
        self.stdout.write("")

        test_user, _ = User.objects.get_or_create(
            username="__rag_quality_diagnostic_user__",
            defaults={"email": "rag-diagnostic@local.test"},
        )

        rows = []
        chroma_latencies = []
        pipeline_latencies = []

        counters = {
            "real_questions": 0,
            "distractors": 0,
            "chroma_no_result": 0,
            "pipeline_no_result": 0,
            "chroma_keyword_hit": 0,
            "pipeline_keyword_hit": 0,
            "with_expected_keywords": 0,
            "pipeline_improved": 0,
            "pipeline_regressed": 0,
            "pipeline_false_positive": 0,
            "chroma_false_positive": 0,
        }

        for index, q in enumerate(questions, start=1):
            category = q["category"]
            question = q["question"]
            expected_keywords = q.get("expected_keywords", [])
            is_distractor = category == "distractor"

            if is_distractor:
                counters["distractors"] += 1
            else:
                counters["real_questions"] += 1
            if expected_keywords:
                counters["with_expected_keywords"] += 1

            chroma_results = []
            chroma_error = None
            t0 = time.time()
            if embedder and total_vectors:
                try:
                    query_embedding = embedder.embed_query(question)
                    raw = collection.query(
                        query_embeddings=[query_embedding],
                        n_results=min(top_k, total_vectors),
                        include=["documents", "metadatas", "distances"],
                    )
                    for text, meta, distance in zip(
                        raw["documents"][0], raw["metadatas"][0], raw["distances"][0]
                    ):
                        chroma_results.append(
                            {
                                "text": text,
                                "score": max(0.0, 1.0 - distance / 2.0),
                                "citation": {
                                    "source": meta.get("source_title", ""),
                                    "article": meta.get("article", ""),
                                    "chunk_id": meta.get("chunk_id"),
                                },
                            }
                        )
                except EmbeddingUnavailableError as exc:
                    chroma_error = str(exc)
                except Exception as exc:
                    chroma_error = f"{type(exc).__name__}: {exc}"
            chroma_latencies.append(time.time() - t0)

            t1 = time.time()
            pipeline_results = retrieve_context(
                question, test_user, legal_request=None, include_user_docs=False, limit=top_k
            )
            context_text, pipeline_citations = format_context(pipeline_results)
            pipeline_latencies.append(time.time() - t1)

            chroma_has = bool(chroma_results)
            pipeline_has = bool(pipeline_results)
            chroma_hit = _keyword_hit(expected_keywords, [r["text"] for r in chroma_results])
            pipeline_hit = _keyword_hit(expected_keywords, [r["text"] for r in pipeline_results])

            if not chroma_has and not is_distractor:
                counters["chroma_no_result"] += 1
            if not pipeline_has and not is_distractor:
                counters["pipeline_no_result"] += 1
            if expected_keywords and chroma_hit:
                counters["chroma_keyword_hit"] += 1
            if expected_keywords and pipeline_hit:
                counters["pipeline_keyword_hit"] += 1

            chroma_top1 = _top1_score(chroma_results)
            pipeline_top1 = _top1_score(pipeline_results)
            if is_distractor and chroma_top1 >= RAG_MIN_SCORE:
                counters["chroma_false_positive"] += 1
            if is_distractor and pipeline_top1 >= RAG_MIN_SCORE:
                counters["pipeline_false_positive"] += 1

            diagnosis = _diagnose_case(
                is_distractor, bool(chroma_hit), bool(pipeline_hit), chroma_has, pipeline_has
            )
            if diagnosis == "pipeline_improved_chroma":
                counters["pipeline_improved"] += 1
            elif diagnosis == "pipeline_regression":
                counters["pipeline_regressed"] += 1

            status = self.style.SUCCESS("OK")
            if diagnosis in {
                "pipeline_regression",
                "pipeline_false_positive",
                "pipeline_returns_irrelevant_context",
                "no_retrieval_dataset_or_index_gap",
            }:
                status = self.style.ERROR("A VERIFIER")
            elif diagnosis in {
                "pipeline_improved_chroma",
                "pipeline_threshold_or_rerank_issue",
                "both_irrelevant_or_keywords_missing",
            }:
                status = self.style.WARNING("DIAGNOSTIC")

            self.stdout.write(
                f"[{index}/{len(questions)}] [{category}] {status} {diagnosis} "
                f"| chroma={chroma_top1:.3f} pipeline={pipeline_top1:.3f}"
            )
            if verbose:
                self.stdout.write(f"  Q: {question}")
                if chroma_error:
                    self.stdout.write(f"  Chroma error: {chroma_error}")
                for rank, item in enumerate(pipeline_results, start=1):
                    citation = item["citation"]
                    self.stdout.write(
                        f"  P#{rank} {item['score']:.3f} "
                        f"{citation.get('source')} art={citation.get('article')}"
                    )

            rows.append(
                {
                    "category": category,
                    "question": question,
                    "expected_keywords": expected_keywords,
                    "diagnosis": diagnosis,
                    "chroma": {
                        "has_result": chroma_has,
                        "top1_score": chroma_top1,
                        "keyword_hit": chroma_hit,
                        "error": chroma_error,
                        "citations": [_compact_citation(item) for item in chroma_results],
                    },
                    "pipeline": {
                        "has_result": pipeline_has,
                        "top1_score": pipeline_top1,
                        "keyword_hit": pipeline_hit,
                        "citations": pipeline_citations,
                        "context_chars": len(context_text),
                    },
                }
            )

        summary = {
            "n_questions": len(questions),
            "n_real_questions": counters["real_questions"],
            "n_distractors": counters["distractors"],
            "indexed_vectors": total_vectors,
            "embedding_available": bool(embedder),
            "chroma_no_result_rate": _rate(counters["chroma_no_result"], counters["real_questions"]),
            "pipeline_no_result_rate": _rate(counters["pipeline_no_result"], counters["real_questions"]),
            "chroma_keyword_hit_rate": _rate(
                counters["chroma_keyword_hit"], counters["with_expected_keywords"]
            ),
            "pipeline_keyword_hit_rate": _rate(
                counters["pipeline_keyword_hit"], counters["with_expected_keywords"]
            ),
            "chroma_false_positive_rate": _rate(
                counters["chroma_false_positive"], counters["distractors"]
            ),
            "pipeline_false_positive_rate": _rate(
                counters["pipeline_false_positive"], counters["distractors"]
            ),
            "pipeline_improved_count": counters["pipeline_improved"],
            "pipeline_regressed_count": counters["pipeline_regressed"],
            "avg_chroma_latency_ms": _avg_ms(chroma_latencies),
            "avg_pipeline_latency_ms": _avg_ms(pipeline_latencies),
        }

        report_path.write_text(
            json.dumps({"summary": summary, "rows": rows}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        self.stdout.write("")
        self.stdout.write(self.style.NOTICE("=" * 70))
        self.stdout.write(self.style.NOTICE("RESUME DIAGNOSTIC"))
        self.stdout.write(self.style.NOTICE("=" * 70))
        self.stdout.write(f"Chroma sans resultat      : {summary['chroma_no_result_rate']}")
        self.stdout.write(f"Pipeline sans resultat    : {summary['pipeline_no_result_rate']}")
        self.stdout.write(f"Chroma pertinence mots    : {summary['chroma_keyword_hit_rate']}")
        self.stdout.write(f"Pipeline pertinence mots  : {summary['pipeline_keyword_hit_rate']}")
        self.stdout.write(f"Ameliorations pipeline    : {summary['pipeline_improved_count']}")
        self.stdout.write(f"Regressions pipeline      : {summary['pipeline_regressed_count']}")
        self.stdout.write(f"Rapport                   : {report_path}")
