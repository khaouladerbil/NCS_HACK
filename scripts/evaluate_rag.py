import argparse
import json
import os
import sys
import time
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from django.contrib.auth import get_user_model  # noqa: E402

from ai_assistant.management.commands.test_real_questions import REAL_QUESTIONS  # noqa: E402
from ai_assistant.services.chroma_client import get_collection  # noqa: E402
from ai_assistant.services.embeddings import EmbeddingUnavailableError, get_embedder  # noqa: E402
from ai_assistant.services.query_enrichment import normalize_for_search  # noqa: E402
from ai_assistant.services.retrieval import RAG_MIN_SCORE, format_context, retrieve_context  # noqa: E402


User = get_user_model()
DEFAULT_REPORT_PATH = ROOT / "scripts" / "rag_eval_report.json"
DEFAULT_DATASET_PATH = ROOT / "scripts" / "rag_eval_dataset.json"


def load_dataset(dataset_path: str | None):
    if dataset_path:
        raw = json.loads(Path(dataset_path).read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            raise ValueError("Dataset must be JSON array.")
        return raw
    return REAL_QUESTIONS


def keyword_hit(expected_keywords, texts):
    if not expected_keywords:
        return None
    blob = normalize_for_search(" ".join(texts))
    return any(normalize_for_search(keyword) in blob for keyword in expected_keywords)


def top1_score(results):
    if not results:
        return 0.0
    return round(float(results[0].get("score", 0.0)), 4)


def avg_ms(values):
    if not values:
        return 0.0
    return round((sum(values) / len(values)) * 1000, 2)


def rate(count, total):
    if not total:
        return None
    return round(count / total, 4)


def compact_citations(results):
    output = []
    for item in results:
        citation = item.get("citation", {})
        output.append(
            {
                "source": citation.get("source") or citation.get("document") or "",
                "article": citation.get("article", ""),
                "reference": citation.get("reference", ""),
                "chunk_id": citation.get("chunk_id"),
                "score": round(float(item.get("score", 0.0)), 4),
            }
        )
    return output


def dataset_stats(dataset):
    categories = Counter(item.get("category", "unknown") for item in dataset)
    with_keywords = sum(1 for item in dataset if item.get("expected_keywords"))
    distractors = sum(1 for item in dataset if item.get("category") == "distractor")
    arabic = sum(1 for item in dataset if any("\u0600" <= ch <= "\u06ff" for ch in item.get("question", "")))
    return {
        "total": len(dataset),
        "categories": dict(categories),
        "with_expected_keywords": with_keywords,
        "without_expected_keywords": len(dataset) - with_keywords,
        "distractors": distractors,
        "arabic_questions": arabic,
    }


def query_chroma(collection, embedder, question, top_k):
    total_vectors = collection.count()
    if not embedder or not total_vectors:
      return [], None

    try:
        query_embedding = embedder.embed_query(question)
        raw = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, total_vectors),
            include=["documents", "metadatas", "distances"],
        )
    except EmbeddingUnavailableError as exc:
        return [], str(exc)
    except Exception as exc:  # pragma: no cover - defensive
        return [], f"{type(exc).__name__}: {exc}"

    results = []
    for text, meta, distance in zip(raw["documents"][0], raw["metadatas"][0], raw["distances"][0]):
        results.append(
            {
                "text": text,
                "score": max(0.0, 1.0 - distance / 2.0),
                "citation": {
                    "source": meta.get("source_title", ""),
                    "article": meta.get("article", ""),
                    "reference": meta.get("reference", ""),
                    "chunk_id": meta.get("chunk_id"),
                },
            }
        )
    return results, None


def evaluate(dataset, top_k):
    collection = get_collection("legal_chunks")
    total_vectors = collection.count()
    embedder = get_embedder()
    test_user, _ = User.objects.get_or_create(
        username="__rag_eval_script_user__",
        defaults={"email": "rag-eval@local.test"},
    )

    chroma_latencies = []
    pipeline_latencies = []
    rows = []
    counters = Counter()

    for index, item in enumerate(dataset, start=1):
        question = item["question"]
        category = item.get("category", "unknown")
        expected_keywords = item.get("expected_keywords", [])
        is_distractor = category == "distractor"

        if is_distractor:
            counters["distractors"] += 1
        else:
            counters["real_questions"] += 1
        if expected_keywords:
            counters["with_expected_keywords"] += 1

        chroma_started = time.time()
        chroma_results, chroma_error = query_chroma(collection, embedder, question, top_k)
        chroma_latencies.append(time.time() - chroma_started)

        pipeline_started = time.time()
        pipeline_results = retrieve_context(
            question,
            test_user,
            legal_request=None,
            include_user_docs=False,
            limit=top_k,
        )
        context_text, pipeline_citations = format_context(pipeline_results)
        pipeline_latencies.append(time.time() - pipeline_started)

        chroma_has = bool(chroma_results)
        pipeline_has = bool(pipeline_results)
        chroma_match = keyword_hit(expected_keywords, [entry["text"] for entry in chroma_results])
        pipeline_match = keyword_hit(expected_keywords, [entry["text"] for entry in pipeline_results])
        chroma_top1 = top1_score(chroma_results)
        pipeline_top1 = top1_score(pipeline_results)

        if not is_distractor and not pipeline_has:
            counters["pipeline_no_result"] += 1
        if not is_distractor and not chroma_has:
            counters["chroma_no_result"] += 1
        if expected_keywords and chroma_match:
            counters["chroma_keyword_hits"] += 1
        if expected_keywords and pipeline_match:
            counters["pipeline_keyword_hits"] += 1
        if is_distractor and chroma_top1 >= RAG_MIN_SCORE:
            counters["chroma_false_positive"] += 1
        if is_distractor and pipeline_top1 >= RAG_MIN_SCORE:
            counters["pipeline_false_positive"] += 1
        if not is_distractor and pipeline_match and not chroma_match:
            counters["pipeline_improved"] += 1
        if not is_distractor and chroma_match and not pipeline_match:
            counters["pipeline_regressed"] += 1

        if is_distractor:
            diagnosis = "pass" if pipeline_top1 < RAG_MIN_SCORE else "false_positive"
        elif not pipeline_has:
            diagnosis = "no_result"
        elif expected_keywords and not pipeline_match:
            diagnosis = "retrieval_miss"
        else:
            diagnosis = "pass"

        rows.append(
            {
                "index": index,
                "category": category,
                "question": question,
                "expected_keywords": expected_keywords,
                "diagnosis": diagnosis,
                "chroma": {
                    "has_result": chroma_has,
                    "top1_score": chroma_top1,
                    "keyword_hit": chroma_match,
                    "error": chroma_error,
                    "citations": compact_citations(chroma_results),
                },
                "pipeline": {
                    "has_result": pipeline_has,
                    "top1_score": pipeline_top1,
                    "keyword_hit": pipeline_match,
                    "context_chars": len(context_text),
                    "citations": pipeline_citations,
                },
            }
        )

    summary = {
        "dataset": dataset_stats(dataset),
        "index": {
            "collection": "legal_chunks",
            "indexed_vectors": total_vectors,
            "embedding_available": bool(embedder),
        },
        "retrieval": {
            "pipeline_keyword_hit_rate": rate(
                counters["pipeline_keyword_hits"], counters["with_expected_keywords"]
            ),
            "chroma_keyword_hit_rate": rate(
                counters["chroma_keyword_hits"], counters["with_expected_keywords"]
            ),
            "pipeline_no_result_rate": rate(
                counters["pipeline_no_result"], counters["real_questions"]
            ),
            "chroma_no_result_rate": rate(
                counters["chroma_no_result"], counters["real_questions"]
            ),
            "pipeline_improved_count": counters["pipeline_improved"],
            "pipeline_regressed_count": counters["pipeline_regressed"],
        },
        "abstention": {
            "threshold": RAG_MIN_SCORE,
            "pipeline_false_positive_rate": rate(
                counters["pipeline_false_positive"], counters["distractors"]
            ),
            "chroma_false_positive_rate": rate(
                counters["chroma_false_positive"], counters["distractors"]
            ),
        },
        "latency": {
            "avg_pipeline_latency_ms": avg_ms(pipeline_latencies),
            "avg_chroma_latency_ms": avg_ms(chroma_latencies),
        },
    }

    return {"summary": summary, "rows": rows}


def main():
    parser = argparse.ArgumentParser(description="Evaluate RAG retrieval quality.")
    parser.add_argument("--dataset", default=str(DEFAULT_DATASET_PATH) if DEFAULT_DATASET_PATH.exists() else None)
    parser.add_argument("--report", default=str(DEFAULT_REPORT_PATH))
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()

    dataset = load_dataset(args.dataset)
    report = evaluate(dataset, args.top_k)

    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    summary = report["summary"]
    print("RAG EVAL")
    print(f"Dataset total                : {summary['dataset']['total']}")
    print(f"Indexed vectors              : {summary['index']['indexed_vectors']}")
    print(f"Pipeline keyword hit rate    : {summary['retrieval']['pipeline_keyword_hit_rate']}")
    print(f"Pipeline no result rate      : {summary['retrieval']['pipeline_no_result_rate']}")
    print(f"Pipeline false positive rate : {summary['abstention']['pipeline_false_positive_rate']}")
    print(f"Pipeline improved count      : {summary['retrieval']['pipeline_improved_count']}")
    print(f"Pipeline regressed count     : {summary['retrieval']['pipeline_regressed_count']}")
    print(f"Avg pipeline latency ms      : {summary['latency']['avg_pipeline_latency_ms']}")
    print(f"Report                       : {report_path}")


if __name__ == "__main__":
    main()
