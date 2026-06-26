import json
import time
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from ai_assistant.services.retrieval import retrieve_context, format_context, RAG_MIN_SCORE
from ai_assistant.services.chroma_client import get_collection

User = get_user_model()
REPORT_PATH = Path(__file__).resolve().parent / "real_questions_report.json"


REAL_QUESTIONS = [
    # --- Travail ---
    {"category": "travail", "question": "Mon patron veut me virer sans preavis, il a le droit ?", "expected_keywords": ["licenciement", "preavis", "travail", "employeur"]},
    {"category": "travail", "question": "Combien de jours de conge j'ai droit par an en Algerie ?", "expected_keywords": ["conge", "travail", "annuel"]},
    {"category": "travail", "question": "J'ai eu un accident au travail, qu'est-ce que je dois faire ?", "expected_keywords": ["accident", "travail", "cnss"]},
    {"category": "travail", "question": "هل يمكن لصاحب العمل أن يخفض راتبي بدون موافقتي؟", "expected_keywords": ["راتب", "عمل", "أجر"]},

    # --- Famille ---
    {"category": "famille", "question": "Je veux divorcer, comment je fais en Algerie ?", "expected_keywords": ["divorce", "famille", "tribunal"]},
    {"category": "famille", "question": "Comment se passe la garde des enfants apres un divorce ?", "expected_keywords": ["garde", "enfant", "divorce"]},
    {"category": "famille", "question": "كيف يتم تقسيم الميراث بين الأبناء في الجزائر؟", "expected_keywords": ["ميراث", "وراثة", "أبناء"]},
    {"category": "famille", "question": "Mon ex-mari ne paie pas la pension alimentaire, que faire ?", "expected_keywords": ["pension", "alimentaire", "nafaqa"]},

    # --- Logement ---
    {"category": "logement", "question": "Mon proprietaire veut m'expulser sans preavis, c'est legal ?", "expected_keywords": ["expulsion", "loyer", "bail", "logement"]},
    {"category": "logement", "question": "Comment faire pour recuperer ma caution de location ?", "expected_keywords": ["caution", "location", "loyer"]},
    {"category": "logement", "question": "Mon voisin a construit un mur sur mon terrain, quels sont mes recours ?", "expected_keywords": ["propriete", "terrain", "voisinage"]},

    # --- Commerce / Consommation ---
    {"category": "consommation", "question": "J'ai achete un telephone defectueux, le vendeur refuse de me rembourser, c'est normal ?", "expected_keywords": ["remboursement", "garantie", "consommateur", "vendeur"]},
    {"category": "commercial", "question": "Comment je peux recuperer une dette d'un client qui ne paie pas sa facture ?", "expected_keywords": ["dette", "creance", "facture", "client"]},
    {"category": "commercial", "question": "Quelles sont les etapes pour creer une SARL en Algerie ?", "expected_keywords": ["societe", "sarl", "registre de commerce"]},

    # --- Administratif ---
    {"category": "administratif", "question": "Comment renouveler mon passeport algerien si j'habite a l'etranger ?", "expected_keywords": ["passeport", "administration", "consulat"]},
    {"category": "administratif", "question": "J'ai besoin d'un certificat de residence, ou je dois aller ?", "expected_keywords": ["certificat", "commune", "residence"]},
    {"category": "administratif", "question": "Comment obtenir un permis de construire a la commune ?", "expected_keywords": ["permis", "construire", "commune"]},

    # --- Penal ---
    {"category": "criminal", "question": "J'ai recu une convocation de la police, je dois avoir peur ?", "expected_keywords": ["convocation", "police", "penal"]},
    {"category": "criminal", "question": "Quelqu'un m'a agresse dans la rue, comment je porte plainte ?", "expected_keywords": ["plainte", "agression", "police", "tribunal"]},
    {"category": "criminal", "question": "ما هي العقوبة على السرقة في القانون الجزائري؟", "expected_keywords": ["سرقة", "عقاب", "جنائي"]},
    {"category": "criminal", "question": "Je suis victime d'arnaque en ligne, quels sont mes recours legaux ?", "expected_keywords": ["arnaque", "escroquerie", "plainte"]},

    # --- Cas vagues ---
    {"category": "vague", "question": "J'ai un probleme avec mon employeur, vous pouvez m'aider ?", "expected_keywords": ["travail", "employeur"]},
    {"category": "vague", "question": "Quels sont mes droits en general en tant que citoyen algerien ?", "expected_keywords": []},
    {"category": "vague", "question": "Quelles sont les lois qui protegent les femmes en Algerie ?", "expected_keywords": ["femme", "famille", "protection"]},

    # --- Distracteurs hors-domaine ---
    {"category": "distractor", "question": "Quelle est la meilleure recette de couscous algerien ?", "expected_keywords": []},
    {"category": "distractor", "question": "Quel temps va-t-il faire a Oran ce week-end ?", "expected_keywords": []},
    {"category": "distractor", "question": "Comment installer Python sur mon ordinateur Windows ?", "expected_keywords": []},
    {"category": "distractor", "question": "Quel est le meilleur joueur de l'equipe nationale algerienne ?", "expected_keywords": []},
    {"category": "distractor", "question": "Comment faire une omelette aux herbes ?", "expected_keywords": []},

    # --- Urgence ---
    {"category": "urgent", "question": "Mon mari me frappe, j'ai peur, qu'est-ce que je peux faire la nuit meme ?", "expected_keywords": ["violence", "police", "protection"]},
    {"category": "urgent", "question": "Mon fils mineur a ete arrete par la police, je fais quoi en urgence ?", "expected_keywords": ["mineur", "arrestation", "avocat"]},
]


class Command(BaseCommand):
    help = (
        "Test du pipeline RAG avec de vraies questions de citoyens "
        "(francais, arabe), sans questions en darija latinise."
    )

    def add_arguments(self, parser):
        parser.add_argument("--top-k", type=int, default=5)
        parser.add_argument("--verbose", action="store_true",
                             help="Affiche le texte complet des chunks recuperes.")
        parser.add_argument("--generate-answer", action="store_true",
                             help="Compatibilite: Gemini est appele par defaut.")
        parser.add_argument("--skip-gemini", action="store_true",
                             help="Desactive Gemini et teste seulement le retrieval.")
        parser.add_argument("--report", default=str(REPORT_PATH))
        parser.add_argument("--category", default=None,
                             help="Ne tester qu'une categorie (travail, famille, logement, etc).")

    def handle(self, *args, **options):
        top_k = options["top_k"]
        verbose = options["verbose"]
        generate_answer = not options["skip_gemini"] or options["generate_answer"]
        category_filter = options["category"]
        report_path = Path(options["report"])

        self.stdout.write(self.style.NOTICE("=" * 70))
        self.stdout.write(self.style.NOTICE("TEST AVEC QUESTIONS REELLES DE CITOYENS"))
        self.stdout.write(self.style.NOTICE("=" * 70))

        collection = get_collection("legal_chunks")
        total_vectors = collection.count()
        self.stdout.write(f"Vecteurs indexes dans 'legal_chunks' : {total_vectors}")
        if total_vectors == 0:
            self.stderr.write(self.style.WARNING(
                "Aucun vecteur indexe. Gemini sera quand meme teste sans contexte RAG. "
                "Pour tester le RAG complet: python manage.py index_chroma"
            ))

        questions = REAL_QUESTIONS
        if category_filter:
            questions = [q for q in questions if q["category"] == category_filter]
        self.stdout.write(f"Questions a tester : {len(questions)}")
        self.stdout.write(f"Top-K              : {top_k}")
        self.stdout.write(f"Generation Gemini  : {'oui' if generate_answer else 'non'}")
        self.stdout.write("")

        test_user, _ = User.objects.get_or_create(
            username="__rag_real_question_test_user__",
            defaults={"email": "rag-real-test@local.test"},
        )

        results_log = []
        n_no_result = 0
        n_distractor_false_positive = 0
        n_distractor = 0
        n_keyword_hit = 0
        n_with_expected_keywords = 0
        latencies = []

        for i, q in enumerate(questions, start=1):
            question = q["question"]
            category = q["category"]
            expected_keywords = [k.lower() for k in q.get("expected_keywords", [])]
            is_distractor = category == "distractor"

            t0 = time.time()
            context_results = retrieve_context(
                question, test_user, legal_request=None, include_user_docs=False, limit=top_k
            )
            context_text, citations = format_context(context_results)
            latencies.append(time.time() - t0)

            answer_text = None
            if generate_answer:
                try:
                    from ai_assistant.services.prompts import build_prompt
                    from ai_assistant.services.gemini_client import generate_with_gemini
                    prompt = build_prompt(task="qa", language="fr", message=question, context=context_text)
                    answer_text = generate_with_gemini(prompt)
                except Exception as exc:
                    answer_text = f"[ERREUR GENERATION: {exc}]"

            top1_score = context_results[0]["score"] if context_results else 0.0
            has_result = bool(context_results)

            retrieved_text_blob = " ".join(r["text"].lower() for r in context_results)
            keyword_hit = False
            if expected_keywords:
                n_with_expected_keywords += 1
                keyword_hit = any(kw in retrieved_text_blob for kw in expected_keywords)
                if keyword_hit:
                    n_keyword_hit += 1

            if is_distractor:
                n_distractor += 1
                is_false_positive = top1_score >= RAG_MIN_SCORE
                if is_false_positive:
                    n_distractor_false_positive += 1
                status = (
                    self.style.ERROR(f"FAUX POSITIF score={top1_score:.3f}")
                    if is_false_positive
                    else self.style.SUCCESS(f"OK rejete score={top1_score:.3f}")
                )
            elif not has_result:
                n_no_result += 1
                status = self.style.WARNING("AUCUN RESULTAT (contexte vide)")
            elif expected_keywords:
                status = (
                    self.style.SUCCESS(f"PERTINENT (score={top1_score:.3f})")
                    if keyword_hit
                    else self.style.ERROR(f"NON PERTINENT (score={top1_score:.3f}, mots-cles absents)")
                )
            else:
                status = self.style.SUCCESS(f"resultat trouve (score={top1_score:.3f})")

            self.stdout.write(f"[{i}/{len(questions)}] [{category}] {status}")
            self.stdout.write(f"     Q: \"{question}\"")

            if verbose or (not has_result and not is_distractor) or (expected_keywords and not keyword_hit and not is_distractor):
                for rank, item in enumerate(context_results, start=1):
                    c = item["citation"]
                    self.stdout.write(
                        f"       #{rank} score={item['score']:.3f} source={c.get('source')} "
                        f"article={c.get('article')} | {item['text'][:100].replace(chr(10), ' ')}..."
                    )
                if answer_text:
                    self.stdout.write(f"     Reponse generee: {answer_text[:300].replace(chr(10), ' ')}...")
            self.stdout.write("")

            results_log.append({
                "category": category,
                "question": question,
                "expected_keywords": expected_keywords,
                "top1_score": round(top1_score, 4),
                "has_result": has_result,
                "keyword_hit": keyword_hit if expected_keywords else None,
                "citations": citations,
                "answer_preview": (answer_text[:500] if answer_text else None),
            })

        # ------------------ rapport final ------------------
        n_total = len(questions)
        n_real_questions = n_total - n_distractor
        avg_latency_ms = (sum(latencies) / len(latencies)) * 1000 if latencies else 0

        self.stdout.write(self.style.NOTICE("=" * 70))
        self.stdout.write(self.style.NOTICE("RESUME"))
        self.stdout.write(self.style.NOTICE("=" * 70))
        self.stdout.write(f"Questions reelles testees         : {n_real_questions}")
        self.stdout.write(f"  - sans aucun resultat            : {n_no_result} ({100*n_no_result/(n_real_questions or 1):.1f}%)")
        if n_with_expected_keywords:
            self.stdout.write(
                f"  - pertinence (mots-cles attendus) : {n_keyword_hit}/{n_with_expected_keywords} "
                f"({100*n_keyword_hit/n_with_expected_keywords:.1f}%)"
            )
        self.stdout.write("")
        self.stdout.write(f"Distracteurs hors-domaine testes  : {n_distractor}")
        if n_distractor:
            fp_rate = 100 * n_distractor_false_positive / n_distractor
            color = self.style.ERROR if fp_rate > 20 else self.style.SUCCESS
            self.stdout.write(color(f"  - faux positifs (acceptes a tort) : {n_distractor_false_positive} ({fp_rate:.1f}%)"))
        self.stdout.write("")
        self.stdout.write(f"Latence moyenne par question : {avg_latency_ms:.1f} ms")
        self.stdout.write(self.style.NOTICE("=" * 70))

        report_path.write_text(json.dumps({
            "summary": {
                "n_real_questions": n_real_questions,
                "n_no_result": n_no_result,
                "keyword_pertinence_rate": (n_keyword_hit / n_with_expected_keywords) if n_with_expected_keywords else None,
                "n_distractor": n_distractor,
                "distractor_false_positive_rate": (n_distractor_false_positive / n_distractor) if n_distractor else None,
                "avg_latency_ms": avg_latency_ms,
            },
            "rows": results_log,
        }, ensure_ascii=False, indent=2), encoding="utf-8")
        self.stdout.write(f"Rapport detaille sauvegarde : {report_path}")
