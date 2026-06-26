import re
import unicodedata

from .language import detect_language


LEGAL_SYNONYMS = {
    "licenciement": ["renvoi", "virer", "preavis", "employeur", "travail"],
    "virer": ["licenciement", "renvoi", "preavis", "employeur", "travail"],
    "conge": ["conges", "annuel", "repos", "travail", "salarie"],
    "accident": ["travail", "cnas", "cnss", "securite sociale", "indemnisation"],
    "divorce": ["dissolution", "mariage", "famille", "tribunal", "garde"],
    "garde": ["enfant", "divorce", "famille", "hadana", "pension"],
    "pension": ["alimentaire", "nafaqa", "divorce", "enfant", "famille"],
    "heritage": ["succession", "mirath", "waratha", "famille"],
    "expulser": ["expulsion", "bail", "loyer", "location", "preavis"],
    "expulsion": ["bail", "loyer", "location", "preavis", "locataire"],
    "caution": ["depot", "garantie", "location", "loyer", "bail"],
    "terrain": ["propriete", "foncier", "voisinage", "construction"],
    "rembourser": ["remboursement", "garantie", "vendeur", "consommateur", "defectueux"],
    "defectueux": ["garantie", "vendeur", "consommateur", "remboursement"],
    "dette": ["creance", "facture", "client", "paiement", "recouvrement"],
    "sarl": ["societe", "registre de commerce", "commerce", "statuts", "creation"],
    "passeport": ["consulat", "administration", "etranger", "renouvellement"],
    "residence": ["certificat", "commune", "administration"],
    "construire": ["permis", "construction", "commune", "urbanisme"],
    "convocation": ["police", "penal", "procureur", "audition"],
    "agression": ["plainte", "police", "penal", "victime", "tribunal"],
    "arnaque": ["escroquerie", "plainte", "police", "penal"],
    "violence": ["protection", "plainte", "police", "femme", "penal"],
    "arrete": ["arrestation", "police", "mineur", "avocat", "penal"],
    "femmes": ["femme", "protection", "violence", "famille", "penal"],
}


ARABIC_LEGAL_TERMS = {
    "عمل": ["travail", "employeur", "salarie", "licenciement"],
    "أجر": ["salaire", "remuneration", "travail"],
    "راتب": ["salaire", "remuneration", "travail"],
    "ميراث": ["heritage", "succession", "famille"],
    "وراثة": ["heritage", "succession", "famille"],
    "أبناء": ["enfants", "famille", "heritage"],
    "سرقة": ["vol", "penal", "infraction"],
    "عقوبة": ["peine", "sanction", "penal"],
    "جنائي": ["penal", "infraction", "tribunal"],
    "شرطة": ["police", "plainte", "penal"],
    "طلاق": ["divorce", "famille", "tribunal"],
}


def strip_accents(text):
    normalized = unicodedata.normalize("NFKD", text or "")
    return "".join(char for char in normalized if not unicodedata.combining(char))


def normalize_for_search(text):
    text = strip_accents(text).lower()
    text = re.sub(r"[^\w\u0600-\u06ff]+", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip()


def enrich_query(query):
    normalized = normalize_for_search(query)
    tokens = set(re.findall(r"[\w\u0600-\u06ff]+", normalized, re.UNICODE))
    additions = []

    for token in tokens:
        additions.extend(LEGAL_SYNONYMS.get(token, []))

    for arabic_term, french_terms in ARABIC_LEGAL_TERMS.items():
        if arabic_term in (query or ""):
            additions.extend(french_terms)

    deduped = []
    seen = set(tokens)
    for term in additions:
        key = normalize_for_search(term)
        if key and key not in seen:
            seen.add(key)
            deduped.append(term)

    expanded_query = " ".join(part for part in [query, *deduped] if part)
    return {
        "original": query or "",
        "expanded": expanded_query,
        "normalized": normalized,
        "language": detect_language(query),
        "added_terms": deduped,
    }
