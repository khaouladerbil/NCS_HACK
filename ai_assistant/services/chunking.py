import re


ABBREVIATIONS = {
    "Art.": "ART_ABBR",
    "art.": "ART_ABBR_LOW",
    "al.": "AL_ABBR",
    "alin.": "ALIN_ABBR",
    "cf.": "CF_ABBR",
    "No.": "NO_ABBR",
    "n.": "N_ABBR",
}
RESTORE = {value: key for key, value in ABBREVIATIONS.items()}


def normalize_text(text):
    return re.sub(r"\s+", " ", (text or "")).strip()


def chunk_text(text, max_chars=1400, overlap_chars=180):
    text = normalize_text(text)
    if not text:
        return []

    protected = _protect_abbreviations(text)
    split_pattern = re.compile(r"\n{2,}|(?<=[.!?])\s+(?=[A-Z\u0600-\u06ff])")
    paragraphs = [
        _restore_abbreviations(part.strip())
        for part in split_pattern.split(protected)
        if part.strip()
    ]

    chunks = []
    current = ""
    for paragraph in paragraphs:
        if len(current) + len(paragraph) + 1 <= max_chars:
            current = f"{current} {paragraph}".strip()
            continue

        if current:
            chunks.append(current)

        if len(paragraph) > max_chars:
            sub_chunks = _split_long_paragraph(paragraph, max_chars, overlap_chars)
            chunks.extend(sub_chunks[:-1])
            current = sub_chunks[-1] if sub_chunks else ""
        else:
            overlap = _overlap(chunks[-1], overlap_chars) if chunks and overlap_chars else ""
            current = normalize_text(f"{overlap} {paragraph}")

    if current:
        chunks.append(current)
    return chunks


def detect_article(text):
    patterns = [
        r"\b(?:article|art\.?)\s+([0-9]+(?:[.\-][0-9]+)?(?:\s*(?:bis|ter|quater))?)",
        r"\b(?:alinea|alin[eé]a?|al\.)\s+([0-9]+)",
        r"المادة\s+([0-9]+(?:\s*(?:bis|ter))?)",
        r"الفقرة\s+([0-9]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text or "", re.I | re.UNICODE)
        if match:
            return match.group(1).strip()
    return ""


def _protect_abbreviations(text):
    for original, placeholder in ABBREVIATIONS.items():
        text = text.replace(original, placeholder)
    text = re.sub(r"(\b\d+)\.(\s+[a-z\u0600-\u06ff])", r"\1NUMPOINT\2", text, flags=re.I)
    return text


def _restore_abbreviations(text):
    for placeholder, original in RESTORE.items():
        text = text.replace(placeholder, original)
    return text.replace("NUMPOINT", ".")


def _split_long_paragraph(text, max_chars, overlap_chars):
    chunks = []
    start = 0
    while start < len(text):
        end = start + max_chars
        if end >= len(text):
            chunks.append(text[start:].strip())
            break
        cut = text.rfind(" ", start, end)
        if cut == -1 or cut <= start:
            cut = end
        chunks.append(text[start:cut].strip())
        start = max(start + 1, cut - overlap_chars)
    return chunks


def _overlap(text, overlap_chars):
    if len(text) <= overlap_chars:
        return text
    tail = text[-overlap_chars:]
    first_space = tail.find(" ")
    return tail[first_space + 1 :] if first_space != -1 else tail
