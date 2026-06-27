import re

from directory_data.models import LawyerProfile
from directory_data.serializers import LawyerMapSerializer
from directory_data.views import haversine_km

from .legal_paths import get_roadmap

SPECIALTY_KEYWORDS = {
    "travail": [
        "travail", "emploi", "licenciement", "salaire", "employeur", "salarie", "conge",
        "preavis", "cnas", "accident travail", "greve", "syndicat", "contrat travail",
        "فصل", "عمل", "أجر", "راتب", "صاحب العمل", "تسريح",
        "work", "employment", "fired", "salary", "employer", "employee",
    ],
    "famille": [
        "divorce", "mariage", "garde", "pension", "enfant", "heritage", "succession",
        "famille", "epoux", "epouse", "nafqah", "hadana", "conciliation", "testament",
        "طلاق", "زواج", "حضانة", "نفقة", "ميراث", "أسرة", "أبناء",
        "divorce", "custody", "alimony", "inheritance", "marriage", "child",
    ],
    "immobilier": [
        "bail", "loyer", "logement", "locataire", "proprietaire", "expulsion", "terrain",
        "construction", "permis", "foncier", "voisinage", "copropriete", "achat",
        "إيجار", "سكن", "طرد", "أرض", "بناء", "ملكية",
        "rent", "tenant", "landlord", "eviction", "property", "land",
    ],
    "commercial": [
        "societe", "sarl", "registre commerce", "contrat", "facture", "dette", "creance",
        "faillite", "commercial", "association", "partenariat", "entreprise",
        "شركة", "تجاري", "عقد", "دين", "فاتورة",
        "company", "contract", "debt", "invoice", "business", "bankruptcy",
    ],
    "administratif": [
        "administration", "mairie", "commune", "wilaya", "prefecture", "permis",
        "refus", "recours", "fonctionnaire", "etat civil", "passeport", "visa",
        "إدارة", "بلدية", "ولاية", "رفض", "جواز",
        "administrative", "municipality", "permit", "civil servant",
    ],
    "penal": [
        "plainte", "police", "gendarmerie", "vol", "agression", "violence", "arnaque",
        "escroquerie", "penal", "prison", "arrestation", "accusation", "victime",
        "شرطة", "شكوى", "سرقة", "اعتداء", "عنف", "جريمة", "سجن",
        "police", "complaint", "theft", "assault", "fraud", "arrest", "victim",
    ],
    "consommation": [
        "garantie", "defectueux", "remboursement", "vendeur", "produit", "consommateur",
        "achat", "retour", "livraison", "qualite",
        "ضمان", "معيب", "استرداد",
        "warranty", "defective", "refund", "consumer", "product",
    ],
}


def classify_specialty(text: str) -> str:
    text_lower = text.lower()
    scores = {specialty: 0 for specialty in SPECIALTY_KEYWORDS}
    for specialty, keywords in SPECIALTY_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[specialty] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "other"


SPECIALTY_TO_DB = {
    "famille": "familial",
    "travail": "travail",
    "immobilier": "immobilier",
    "commercial": "commercial",
    "administratif": "administratif",
    "penal": "pénal",
    "consommation": "consommation",
}


def get_nearest_lawyers(specialty: str, lat: float = None, lon: float = None, limit: int = 3):
    qs = LawyerProfile.objects.select_related("address").filter(
        approved=True,
        address__latitude__isnull=False,
        address__longitude__isnull=False,
    )
    db_term = SPECIALTY_TO_DB.get(specialty)
    if db_term:
        qs = qs.filter(specialization__icontains=db_term)

    if lat is not None and lon is not None:
        results = []
        for lawyer in qs:
            addr = lawyer.address
            dist = haversine_km(lat, lon, float(addr.latitude), float(addr.longitude))
            results.append((dist, lawyer))
        results.sort(key=lambda x: x[0])
        lawyers = [l for _, l in results[:limit]]
        distances = [round(d, 1) for d, _ in results[:limit]]
    else:
        lawyers = list(qs[:limit])
        distances = [None] * len(lawyers)

    serialized = LawyerMapSerializer(lawyers, many=True).data
    for item, dist in zip(serialized, distances):
        item["distance_km"] = dist
    return list(serialized)


def build_analyze_response(message: str, lat: float = None, lon: float = None) -> dict:
    specialty = classify_specialty(message)
    roadmap = get_roadmap(specialty)
    lawyers = get_nearest_lawyers(specialty, lat, lon)
    return {
        "specialty": specialty,
        "roadmap": roadmap,
        "lawyers": lawyers,
    }
