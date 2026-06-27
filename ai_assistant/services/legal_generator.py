import logging
from pathlib import Path

from django.conf import settings

from .gemini_client import GeminiError, generate_with_gemini
from .text_extraction import _extract_pdf

logger = logging.getLogger(__name__)

# PDF de référence (guide de rédaction) servant de modèle de style/format
REFERENCE_PDF = Path(settings.MEDIA_ROOT) / "assistant_documents" / "araid_writer_book.pdf"

_REFERENCE_TEXT = None


def _get_reference_text() -> str:
    global _REFERENCE_TEXT
    if _REFERENCE_TEXT is None:
        try:
            _REFERENCE_TEXT = _extract_pdf(REFERENCE_PDF)[:8000]
        except Exception:
            logger.exception("Impossible de lire le PDF de référence.")
            _REFERENCE_TEXT = ""
    return _REFERENCE_TEXT


GENERATION_PROMPT = """Tu es un juriste-rédacteur expert en droit algérien. Tu rédiges des documents juridiques professionnels (contrats, requêtes, mises en demeure, attestations, procurations, statuts, plaintes, etc.) selon ce que l'utilisateur demande.

Tu disposes d'un GUIDE DE RÉDACTION de référence (extrait ci-dessous). Inspire-toi de son style, sa structure, ses formules juridiques et sa mise en forme pour produire un document de qualité équivalente.

=== GUIDE DE RÉDACTION (référence) ===
{reference}
=== FIN DU GUIDE ===

{context}

DEMANDE DE L'UTILISATEUR:
\"\"\"
{prompt}
\"\"\"

Rédige le document juridique demandé en respectant ces règles:
- Produis UNIQUEMENT le document final, prêt à l'emploi, en Markdown.
- Structure claire: titre, parties, articles/clauses numérotés, date et lieu, signatures.
- Utilise les formules juridiques algériennes appropriées.
- Mets [entre crochets] les informations que l'utilisateur devra compléter (noms, montants, dates, adresses).
- Langue: {language}.
- N'ajoute aucun commentaire avant ou après le document.
"""


def generate_legal_text(prompt: str, language: str = "fr", context: str = "") -> str:
    reference = _get_reference_text()
    context_block = f"DOCUMENTS JURIDIQUES PERTINENTS:\n{context}\n" if context else ""

    full_prompt = GENERATION_PROMPT.format(
        reference=reference or "(guide indisponible — utilise tes connaissances en droit algérien)",
        context=context_block,
        prompt=prompt,
        language={"fr": "français", "ar": "arabe", "en": "anglais"}.get(language, "français"),
    )

    try:
        content = generate_with_gemini(full_prompt).strip()
    except GeminiError:
        raise

    # Nettoyage d'éventuels fences markdown
    if content.startswith("```"):
        parts = content.split("```")
        if len(parts) >= 2:
            content = parts[1]
            if content.startswith("markdown"):
                content = content[len("markdown"):]
            content = content.strip()
    return content
