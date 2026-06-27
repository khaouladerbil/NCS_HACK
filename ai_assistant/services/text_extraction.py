from pathlib import Path


def extract_text_from_file(file_field):
    path = Path(file_field.path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _extract_pdf(path)
    if suffix in {".docx", ".doc"}:
        return _extract_docx(path)
    if suffix in {".txt", ".md", ".json"}:
        return path.read_text(encoding="utf-8", errors="ignore")
    if suffix in {".png", ".jpg", ".jpeg", ".webp"}:
        return _extract_image(path)
    return ""


def _extract_pdf(path):
    extractors = (_extract_pdf_pypdf, _extract_pdf_pypdf2, _extract_pdf_plumber, _extract_pdf_fitz)
    for extractor in extractors:
        text = extractor(path)
        if text.strip():
            return text
    return ""


def _extract_pdf_pypdf(path):
    try:
        from pypdf import PdfReader

        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        return ""


def _extract_pdf_pypdf2(path):
    try:
        from PyPDF2 import PdfReader

        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        return ""


def _extract_pdf_plumber(path):
    try:
        import pdfplumber

        with pdfplumber.open(str(path)) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception:
        return ""


def _extract_pdf_fitz(path):
    try:
        import fitz

        document = fitz.open(str(path))
        return "\n".join(page.get_text() or "" for page in document)
    except Exception:
        return ""


def _extract_docx(path):
    try:
        from docx import Document

        document = Document(str(path))
        return "\n".join(paragraph.text for paragraph in document.paragraphs)
    except Exception:
        return ""


_EASYOCR_READER = None


def _extract_image(path):
    # 1) Tesseract (léger, si le binaire est installé)
    text = _extract_image_tesseract(path)
    if text.strip():
        return text
    # 2) EasyOCR (autonome, multilingue) en fallback
    return _extract_image_easyocr(path)


def _extract_image_tesseract(path):
    try:
        import pytesseract
        from PIL import Image

        return pytesseract.image_to_string(Image.open(str(path)), lang="fra+ara+eng")
    except Exception:
        return ""


def _extract_image_easyocr(path):
    global _EASYOCR_READER
    try:
        import easyocr

        if _EASYOCR_READER is None:
            # 'ar' n'est pas compatible avec le latin dans un même reader → fr+en
            _EASYOCR_READER = easyocr.Reader(["fr", "en"], gpu=False)
        result = _EASYOCR_READER.readtext(str(path), detail=0)
        return "\n".join(result)
    except Exception:
        return ""
