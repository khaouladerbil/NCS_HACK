import re

from ai_assistant.models import LawyerProfile


KEYWORDS = {
    "labor": [
        "travail", "salaire", "licenciement", "employeur", "contrat de travail",
        "cnss", "preavis", "conge", "accident de travail", "عمل", "راتب",
        "فصل", "اجر", "khdma", "khedma", "patron",
    ],
    "family": [
        "famille", "divorce", "garde", "pension", "mariage", "succession",
        "heritage", "kafala", "طلاق", "حضانة", "نفقة", "زواج", "ميراث",
        "talaq", "hdana", "nafaqa", "zwaj", "miras",
    ],
    "property": [
        "logement", "loyer", "location", "voisin", "propriete", "bail",
        "expulsion", "notaire", "سكن", "ايجار", "إيجار", "ملكية", "عقار",
        "طرد", "dar", "sken", "kiraa", "3qar",
    ],
    "commercial": [
        "societe", "commerce", "facture", "client", "fournisseur", "entreprise",
        "registre de commerce", "dette", "creance", "شركة", "تجارة", "فاتورة",
        "ديون", "shrika", "tijara", "rc",
    ],
    "administrative": [
        "commune", "wilaya", "ministere", "administration", "certificat",
        "daira", "attestation", "passeport", "permis", "autorisation",
        "بلدية", "ولاية", "وزارة", "شهادة", "ترخيص", "baladiya",
    ],
    "consumer": [
        "remboursement", "garantie", "vendeur", "consommateur", "arnaque",
        "achat", "livraison", "استرداد", "ضمان", "مستهلك", "احتيال",
        "produit", "defectueux",
    ],
    "criminal": [
        "plainte", "convocation", "police", "tribunal", "penal", "arrestation",
        "prison", "infraction", "delit", "crime", "parquet", "agression",
        "شكوى", "شرطة", "محكمة", "جنائي", "توقيف", "اعتقال", "جريمة",
    ],
}

RELATED = {
    "family": {"civil", "property"},
    "labor": {"commercial", "civil"},
    "property": {"civil", "administrative"},
    "commercial": {"civil", "labor"},
    "administrative": {"civil", "criminal"},
    "consumer": {"commercial", "civil"},
    "criminal": {"administrative"},
}

# CORRECTION : limite pour éviter un chargement complet de la table en mémoire
_LAWYER_QUERY_LIMIT = 200


def classify_specialty(text):
    normalized = _normalize(text)
    scores = {}
    for specialty, keywords in KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword in normalized:
                score += 2 if " " in keyword else 1
        scores[specialty] = score
    best = max(scores, key=scores.get)
    return best if scores[best] else "other"


def recommend_lawyers(message, wilaya="", language="fr", limit=5):
    specialty = classify_specialty(message)

    # CORRECTION : limiter la requête DB + utiliser only() pour ne charger
    # que les champs nécessaires au scoring
    lawyers = LawyerProfile.objects.filter(is_available=True).only(
        "id", "full_name", "specialties", "wilaya", "languages",
        "phone", "email", "commune", "metadata",
    )[:_LAWYER_QUERY_LIMIT]

    scored = []

    for lawyer in lawyers:
        score = 0
        specialties = set(lawyer.specialties or [])
        languages = set(lawyer.languages or [])

        if specialty != "other" and specialty in specialties:
            score += 50
            score += min(15, len(specialties & RELATED.get(specialty, set())) * 5)
        if wilaya and lawyer.wilaya.lower() == wilaya.lower():
            score += 25
        if language in languages:
            score += 10
        scored.append((score, lawyer))

    scored.sort(key=lambda item: item[0], reverse=True)
    result = [lawyer for score, lawyer in scored[:limit] if score >= 30]
    if not result:
        result = [
            lawyer for score, lawyer in scored[:limit]
            if language in (lawyer.languages or [])
        ]
    return specialty, result


def _normalize(text):
    return re.sub(r"\s+", " ", (text or "").lower()).strip()