import re

from .legal_paths import LEGAL_PATHS, SPECIALTY_LABELS
from .lawyer_recommendation_service import LawyerRecommendationService

KEYWORDS = {
    "labor": [
        "travail", "salaire", "licenciement", "employeur", "contrat de travail",
        "cnss", "preavis", "conge", "accident de travail", "عمل", "راتب",
        "فصل", "اجر", "patron", "work", "fired", "salary", "contract",
    ],
    "family": [
        "famille", "divorce", "garde", "pension", "mariage", "succession",
        "heritage", "kafala", "طلاق", "حضانة", "نفقة", "زواج", "ميراث",
        "family", "custody", "alimony", "marriage",
    ],
    "property": [
        "logement", "loyer", "location", "voisin", "propriete", "bail",
        "expulsion", "notaire", "سكن", "ايجار", "إيجار", "ملكية", "عقار",
        "طرد", "house", "rent", "landlord", "tenant", "property",
    ],
    "commercial": [
        "societe", "commerce", "facture", "client", "fournisseur", "entreprise",
        "registre de commerce", "dette", "creance", "شركة", "تجارة", "فاتورة",
        "ديون", "rc", "business", "invoice", "debt", "company",
    ],
    "administrative": [
        "commune", "wilaya", "ministere", "administration", "certificat",
        "daira", "attestation", "passeport", "permis", "autorisation",
        "بلدية", "ولاية", "وزارة", "شهادة", "ترخيص", "permit", "license",
    ],
    "consumer": [
        "remboursement", "garantie", "vendeur", "consommateur", "arnaque",
        "achat", "livraison", "استرداد", "ضمان", "مستهلك", "احتيال",
        "produit", "defectueux", "refund", "warranty", "scam", "purchase",
    ],
    "criminal": [
        "plainte", "convocation", "police", "tribunal", "penal", "arrestation",
        "prison", "infraction", "delit", "crime", "parquet", "agression",
        "شكوى", "شرطة", "محكمة", "جنائي", "توقيف", "اعتقال", "جريمة",
        "complaint", "arrest", "assault", "theft",
    ],
}


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").lower()).strip()


def classify_specialty(text: str) -> str:
    normalized = _normalize(text)
    scores: dict[str, int] = {}
    for specialty, keywords in KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword in normalized:
                score += 2 if " " in keyword else 1
        scores[specialty] = score
    best = max(scores, key=scores.get)
    return best if scores[best] else "other"


def build_analyze_response(message: str, lat: float, lon: float, limit: int = 3) -> dict:
    specialty = classify_specialty(message)
    steps = LEGAL_PATHS.get(specialty, LEGAL_PATHS["other"])
    label = SPECIALTY_LABELS.get(specialty, "Conseil juridique général")

    results = LawyerRecommendationService.recommend(
        None,
        specialty,
        lat=str(lat),
        lng=str(lon),
    )[:limit]

    lawyers = []
    for r in results:
        lw = r["lawyer"]
        addr = lw.address
        lawyers.append({
            "id": lw.id,
            "first_name": lw.first_name,
            "last_name": lw.last_name,
            "rating": lw.rating,
            "address": {
                "city": addr.city if addr else "",
                "state": addr.state if addr else "",
            },
            "specializations": r["specializations"],
            "distance_km": r["distance_km"],
        })

    return {
        "specialty": specialty,
        "specialty_label": label,
        "steps": steps,
        "lawyers": lawyers,
    }
