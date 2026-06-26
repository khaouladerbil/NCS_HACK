# AI Assistant RAG

## Dataset JSON

Colle ton dataset ici:

`ai_assistant/data/legal_dataset.json`

Format accepte:

```json
{
  "sources": [
    {
      "title": "Code du travail - extrait",
      "source_type": "code",
      "jurisdiction": "Algeria",
      "category": "labor",
      "reference": "Reference officielle",
      "language": "fr",
      "chunks": [
        {
          "article": "1",
          "section": "Titre/chapitre",
          "text": "Texte exact de l'article..."
        }
      ]
    }
  ]
}
```

Import admin:

`POST /api/assistant/sources/import_dataset/`

## Endpoints

- `POST /api/assistant/documents/` upload PDF/image/Word utilisateur.
- `POST /api/assistant/chat/` question, explication, analyse, draft, avec historique.
- `POST /api/assistant/draft/` redaction 3arida + export `text`, `pdf`, `docx`.
- `POST /api/assistant/recommend-lawyer/` recommandation avocat par specialite/wilaya/langue.
- `GET /api/assistant/sessions/` historique chat utilisateur.

## Env

```env
GEMINI_API_KEY=ta_cle
GEMINI_MODEL=gemini-1.5-flash
RAG_EMBEDDING_MODEL=intfloat/multilingual-e5-large
```

Pour E5 large multilingual et exports Word/PDF:

`pip install -r requirements-rag.txt`
