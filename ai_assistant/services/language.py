import re


ARABIC_RE = re.compile(r"[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]")

FRENCH_HINTS = {
    "le", "la", "les", "des", "une", "du", "droit", "loi", "code", "article",
    "procedure", "contrat", "tribunal", "avocat", "recours", "requete",
    "commune", "wilaya", "divorce", "licenciement", "loyer", "heritage",
    "comment", "quoi", "quand", "pourquoi", "quel", "quelle",
}
ENGLISH_HINTS = {
    "the", "and", "what", "how", "can", "law", "legal", "document",
    "contract", "rights", "court", "lawyer", "case", "employment",
    "property", "appeal", "claim", "need", "want", "help",
}

# CORRECTION ③ : darija latinisé reconnu comme langue distincte
DARIJA_HINTS = {
    "wach", "wash", "kifach", "chkoun", "win", "bghit", "ndir", "3ndi",
    "3andek", "machi", "makanch", "rah", "ana", "howa", "hiya", "dyali",
    "mahkama", "wakil", "haqqi", "bezzaf", "chhal", "fach", "daba",
    "zwina", "khouya", "khti", "3aref", "nta", "nti", "hna", "ntuma",
    "smahli", "walo", "bzaf", "safi", "baraka",
}


def detect_language(text, fallback="fr"):
    """
    Détecte la langue dominante du message.

    Retourne :
      - "ar"     → arabe standard (≥30% caractères arabes)
      - "darija" → darija latinisé (mots-clés darija détectés)
      - "en"     → anglais (hints anglais sans hints français)
      - "fr"     → français (par défaut)
    """
    text = (text or "").strip()
    if not text:
        return fallback or "fr"

    # Arabe standard : caractères arabes dominants
    if _is_arabic_dominant(text):
        return "ar"

    words = set(re.findall(r"[a-zA-Z0-9]+", text.lower()))

    # CORRECTION ③ : darija retourne "darija" et non "fr"
    if words & DARIJA_HINTS:
        return "darija"

    en_score = len(words & ENGLISH_HINTS)
    fr_score = len(words & FRENCH_HINTS)

    if en_score > 0 and fr_score == 0:
        return "en"
    if fr_score > 0:
        return "fr"

    return fallback or "fr"


def _is_arabic_dominant(text):
    non_space = [char for char in text if not char.isspace()]
    if not non_space:
        return False
    arabic_count = sum(1 for char in non_space if ARABIC_RE.match(char))
    return arabic_count / len(non_space) >= 0.30