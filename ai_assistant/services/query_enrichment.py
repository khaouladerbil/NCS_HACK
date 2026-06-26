import re
import unicodedata

from .language import detect_language


LEGAL_SYNONYMS = {
    "licenciement": ["renvoi", "preavis", "employeur", "travail", "salarie"],
    "virer": ["licenciement", "renvoi", "preavis", "employeur", "travail"],
    "renvoi": ["licenciement", "preavis", "travail", "employeur", "salarie"],
    "salaire": ["paie", "remuneration", "travail", "employeur", "salarie"],
    "paie": ["salaire", "remuneration", "travail", "employeur"],
    "conge": ["conges", "annuel", "repos", "travail", "salarie"],
    "accident": ["travail", "cnas", "cnss", "securite sociale", "indemnisation"],
    "indemnisation": ["accident", "travail", "cnas", "cnss", "reparation"],
    "divorce": ["dissolution", "mariage", "famille", "tribunal", "epoux", "epouse"],
    "divorcer": ["divorce", "dissolution", "famille", "tribunal", "conciliation"],
    "conciliation": ["divorce", "famille", "tribunal", "epoux", "epouse"],
    "garde": ["enfant", "divorce", "famille", "custodie", "pension"],
    "pension": ["alimentaire", "divorce", "enfant", "famille", "nafqah"],
    "heritage": ["succession", "heritier", "famille", "part successorale"],
    "succession": ["heritage", "heritier", "testament", "famille"],
    "testament": ["succession", "heritage", "heritier", "famille"],
    "expulser": ["expulsion", "bail", "loyer", "location", "preavis"],
    "expulsion": ["bail", "loyer", "location", "preavis", "locataire"],
    "locataire": ["bail", "location", "loyer", "expulsion", "proprietaire"],
    "proprietaire": ["bail", "location", "loyer", "expulsion", "locataire"],
    "caution": ["depot", "garantie", "location", "loyer", "bail"],
    "terrain": ["propriete", "foncier", "voisinage", "construction"],
    "rembourser": ["remboursement", "garantie", "vendeur", "consommateur", "defectueux"],
    "defectueux": ["garantie", "vendeur", "consommateur", "remboursement"],
    "dette": ["creance", "facture", "client", "paiement", "recouvrement"],
    "facture": ["dette", "creance", "paiement", "client", "commercial"],
    "sarl": ["societe", "registre de commerce", "commerce", "statuts", "creation"],
    "registre": ["registre de commerce", "sarl", "societe", "commerce", "entreprise"],
    "societe": ["sarl", "registre de commerce", "commerce", "statuts", "gerant"],
    "passeport": ["consulat", "administration", "etranger", "renouvellement"],
    "residence": ["certificat", "commune", "administration"],
    "construire": ["permis", "construction", "commune", "urbanisme"],
    "convocation": ["police", "penal", "procureur", "audition"],
    "agression": ["plainte", "police", "penal", "victime", "tribunal"],
    "arnaque": ["escroquerie", "plainte", "police", "penal", "fraude"],
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
    "حضانة": ["garde", "enfant", "famille"],
    "نفقة": ["pension", "alimentaire", "famille"],
    "عقد": ["contrat", "obligation", "civil"],
    "محكمة": ["tribunal", "juge", "procedure"],
    "قانون": ["loi", "juridique", "article"],
    "شكوى": ["plainte", "recours", "police"],
    "إيجار": ["location", "bail", "loyer"],
    "طرد": ["expulsion", "preavis", "locataire"],
    "شركة": ["societe", "commercial", "registre"],
    "جواز": ["passeport", "consulat", "administration"],
    "فصل": ["licenciement", "renvoi", "travail", "employeur"],
    "تعويض": ["indemnisation", "reparation", "travail", "accident"],
    "سجل": ["registre", "registre de commerce", "societe", "commerce"],
    "جنسية": ["nationalite", "administration", "etat civil"],
    "صاحب": ["employeur", "travail", "salaire"],
    "راتبي": ["salaire", "remuneration", "travail"],
}


LEGAL_KEYWORDS = {
    "droit", "loi", "lois", "legal", "juridique", "tribunal", "juge", "avocat",
    "code", "article", "decret", "arrete", "ordonnance", "constitution",
    "litige", "conflit", "contentieux", "plainte", "poursuite", "procedure",
    "divorce", "mariage", "famille", "garde", "pension", "enfant", "enfants",
    "heritage", "succession", "testament", "donation", "epoux", "epouse",
    "naissance", "adoption", "filiation", "custodie", "nafqah",
    "travail", "licenciement", "contrat", "salarie", "employeur", "preavis",
    "conge", "salaires", "salaire", "cnas", "cnss", "securite sociale",
    "accident", "indemnisation", "conges", "greve",
    "penal", "infraction", "vol", "violence", "agression", "escroquerie",
    "arnaque", "victime", "police", "procureur", "amende", "prison",
    "detention", "arrestation", "convocation", "enquete", "temoin",
    "bail", "loyer", "location", "logement", "expulsion", "locataire",
    "proprietaire", "terrain", "construction", "permis", "foncier",
    "voisinage", "copropriete", "caution", "garantie",
    "sarl", "societe", "commerce", "commercial", "entreprise", "registre",
    "statuts", "gerant", "associe", "creation", "dissolution", "faillite",
    "consommateur", "defectueux", "remboursement", "garantie", "facture",
    "dette", "creance", "recouvrement", "vendeur",
    "passeport", "residence", "visa", "carte", "nationalite", "naturalisation",
    "etranger", "consulat", "administration", "commune", "etat", "civil",
    "law", "legal", "court", "judge", "attorney", "lawyer", "divorce",
    "custody", "inheritance", "contract", "tenant", "landlord", "eviction",
    "crime", "criminal", "theft", "assault", "fraud", "complaint",
    "marriage", "child", "adoption", "immigration", "visa", "citizenship",
    "arbitration", "mediation", "lawsuit", "appeal", "verdict", "sentence",
    "fine", "imprisonment", "witness", "evidence", "testimony",
    "عمل", "أجر", "راتب", "ميراث", "وراثة", "أبناء", "سرقة", "عقوبة",
    "جنائي", "شرطة", "طلاق", "حضانة", "نفقة", "عقد", "محكمة", "قانون",
    "شكوى", "إيجار", "طرد", "شركة", "جواز",
    "دعوى", "حكم", "زواج", "إرث", "جريمة", "سجن", "غرامة", "ملكية", "أرض",
}


NON_LEGAL_EXACT = {
    "recette", "cuisiner", "plat", "gateau", "patisserie", "ingredient",
    "manger", "boire", "restaurant", "cuisinier",
    "meteo", "temps", "pluie", "soleil", "temperature", "weather",
    "python", "javascript", "typescript", "react", "django", "html", "css",
    "programmation", "programming", "bug", "ordinateur", "algorithme",
    "logiciel", "application", "internet",
    "football", "sport", "match", "film", "serie", "musique", "chanson",
    "jeu", "jeux", "jouer", "voyage", "vacances", "game", "movie",
    "maladie", "symptome", "fievre", "toux", "grippe", "hopital",
    "docteur", "diagnostic", "traitement", "medicament",
    "mathematiques", "maths", "physique", "chimie", "biologie",
    "histoire", "geographie", "philosophie",
    "horoscope", "astrologie", "reve", "reves", "religion",
    "طبخ", "أكل", "شرب", "مطبخ", "وصفة", "طعام",
    "طقس", "مطر", "شمس", "حرارة", "ثلج", "ريح",
    "رياضة", "كرة", "قدم", "مباراة", "ملعب", "فريق", "بطل", "سباق",
    "مرض", "حمى", "سعال", "دواء", "علاج", "طبيب", "مستشفى",
    "برمجة", "حاسوب", "تطبيق", "انترنت", "كمبيوتر", "برنامج",
    "رياضيات", "فيزياء", "كيمياء", "أحياء", "تاريخ", "جغرافيا", "فلسفة",
    "أبراج", "حلم", "أحلام", "صلاة", "صيام", "دين",
}


GREETINGS = {
    "bonjour", "bonsoir", "salut", "hello", "hi", "hey", "slt", "bjr",
    "مرحبا", "سلام", "اهلا", "أهلا", "صباح", "مساء", "تحية",
}


LEGAL_STOPWORDS = {
    "le", "la", "les", "de", "du", "des", "un", "une", "et", "est", "en",
    "au", "aux", "ce", "que", "qui", "pour", "par", "sur", "dans", "avec",
    "il", "elle", "je", "tu", "nous", "vous", "pas", "plus",
    "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of",
    "with", "by", "from", "is", "are", "was", "were", "this", "that",
    "في", "من", "الى", "إلى", "على", "عن", "مع", "هذا", "هذه",
    "الذي", "التي", "ان", "أن", "لا", "ما", "لم", "لن", "قد",
}


ARABIC_DIACRITICS_RE = re.compile(r"[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]")
ARABIC_TOKEN_RE = re.compile(r"[\w\u0600-\u06ff]+", re.UNICODE)
LATIN_TOKEN_RE = re.compile(r"\w+", re.UNICODE)


def strip_accents(text):
    normalized = unicodedata.normalize("NFKD", text or "")
    return "".join(char for char in normalized if not unicodedata.combining(char))


def normalize_arabic(text):
    text = ARABIC_DIACRITICS_RE.sub("", text or "")
    replacements = {
        "أ": "ا",
        "إ": "ا",
        "آ": "ا",
        "ى": "ي",
        "ؤ": "و",
        "ئ": "ي",
        "ة": "ه",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def normalize_for_search(text):
    text = strip_accents(text).lower()
    text = normalize_arabic(text)
    text = re.sub(r"[^\w\u0600-\u06ff]+", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip()


def _tokenize(text):
    return set(
        token
        for token in re.findall(r"[\w\u0600-\u06ff]+", normalize_for_search(text), re.UNICODE)
        if token and token not in LEGAL_STOPWORDS
    )


def is_legal_query(query):
    if not query or not query.strip():
        return False

    tokens = _tokenize(query)
    if not tokens:
        return False

    legal_hits = tokens & LEGAL_KEYWORDS
    non_legal_hits = tokens & NON_LEGAL_EXACT
    greeting_hits = tokens & GREETINGS
    synonym_hits = tokens & set(LEGAL_SYNONYMS.keys())
    arabic_seed_hits = {
        normalize_for_search(term) for term in ARABIC_LEGAL_TERMS.keys()
    } & tokens

    if greeting_hits and not legal_hits:
        return False
    if non_legal_hits and not legal_hits and not synonym_hits and not arabic_seed_hits:
        return False
    if non_legal_hits and len(non_legal_hits) >= len(legal_hits | synonym_hits | arabic_seed_hits):
        return False
    if legal_hits or synonym_hits or arabic_seed_hits:
        return True

    legal_patterns = (
        "comment divorc",
        "pension alimentaire",
        "registre de commerce",
        "permis de construire",
        "porter plainte",
        "salar",
        "employeur",
        "travail",
        "bail",
        "loyer",
        "tribunal",
        "article",
        "avocat",
        "محكم",
        "طلاق",
        "قانون",
        "شرط",
        "شكو",
        "راتب",
        "صاحب العمل",
        "عمل",
    )
    normalized = normalize_for_search(query)
    return any(pattern in normalized for pattern in legal_patterns)


def enrich_query(query):
    normalized = normalize_for_search(query)
    tokens = set(re.findall(r"[\w\u0600-\u06ff]+", normalized, re.UNICODE))
    additions = []

    for token in tokens:
        additions.extend(LEGAL_SYNONYMS.get(token, []))

    for arabic_term, french_terms in ARABIC_LEGAL_TERMS.items():
        normalized_term = normalize_for_search(arabic_term)
        if normalized_term in normalized:
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
        "tokens": list(tokens),
        "is_legal": is_legal_query(query),
    }
