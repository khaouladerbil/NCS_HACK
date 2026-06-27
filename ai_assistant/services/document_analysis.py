import json
import logging

from .gemini_client import GeminiError, generate_with_gemini

logger = logging.getLogger(__name__)


ANALYSIS_PROMPT = """Tu es un juriste expert algérien spécialisé dans la vérification de documents légaux et la détection de fraude.

Analyse le document suivant et réponds UNIQUEMENT en JSON strict (sans markdown, sans ```).

DOCUMENT À ANALYSER:
\"\"\"
{text}
\"\"\"

Format JSON attendu:
{{
  "document_type": "type du document (contrat, jugement, acte notarié, attestation, facture, etc.)",
  "summary": "résumé clair du contenu en 2-3 phrases, en français simple",
  "is_legal_document": true ou false,
  "fraud_risk": "faible" ou "moyen" ou "eleve",
  "is_suspicious": true ou false,
  "red_flags": ["liste des éléments suspects ou anomalies détectées (incohérences de dates, montants, signatures manquantes, mentions légales absentes, etc.)"],
  "missing_elements": ["éléments légaux obligatoires manquants pour ce type de document"],
  "key_points": ["points juridiques importants à retenir"],
  "recommendations": ["conseils concrets pour l'utilisateur"]
}}

Règles:
- Si le texte est vide ou illisible, mets fraud_risk="moyen", is_suspicious=true, et explique dans red_flags que le document n'a pas pu être lu correctement.
- Base ta détection de fraude sur: incohérences internes, mentions légales manquantes, formulations inhabituelles, dates/montants illogiques, absence de signatures ou cachets attendus.
- Sois factuel et prudent. N'accuse pas sans indices concrets.
- red_flags vide [] si aucun problème détecté.
- Langue: français.
"""


def analyze_document(extracted_text: str) -> dict:
    text = (extracted_text or "").strip()

    if not text:
        return {
            "document_type": "inconnu",
            "summary": "Le document n'a pas pu être lu (texte vide ou illisible).",
            "is_legal_document": False,
            "fraud_risk": "moyen",
            "is_suspicious": True,
            "red_flags": ["Aucun texte exploitable n'a pu être extrait du document."],
            "missing_elements": [],
            "key_points": [],
            "recommendations": [
                "Vérifiez que le fichier est lisible (scan net, non protégé par mot de passe).",
                "Réessayez avec une meilleure qualité d'image ou un PDF texte.",
            ],
        }

    # Limite la taille envoyée au modèle
    snippet = text[:12000]
    prompt = ANALYSIS_PROMPT.format(text=snippet)

    try:
        raw = generate_with_gemini(prompt).strip()
    except GeminiError as exc:
        logger.error("Document analysis AI call failed: %s", exc)
        raise

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("Document analysis returned non-JSON, wrapping raw text.")
        data = {
            "document_type": "inconnu",
            "summary": raw[:500],
            "is_legal_document": True,
            "fraud_risk": "faible",
            "is_suspicious": False,
            "red_flags": [],
            "missing_elements": [],
            "key_points": [],
            "recommendations": [],
        }

    # Normalisation défensive
    data.setdefault("document_type", "inconnu")
    data.setdefault("summary", "")
    data.setdefault("fraud_risk", "faible")
    data.setdefault("is_suspicious", False)
    for key in ("red_flags", "missing_elements", "key_points", "recommendations"):
        if not isinstance(data.get(key), list):
            data[key] = []
    return data
