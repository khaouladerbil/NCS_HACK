# NCS HACK - Legal Tech Platform

Backend API for an Algerian legal tech platform with AI-assisted case management, lawyer directory, and document drafting.

## Tech Stack

- **Django 6.0** + **Django REST Framework 3.17**
- **PostgreSQL** (Neon)
- **JWT Auth** (SimpleJWT)
- **ReportLab** (PDF export)
- **Nominatim OSM** (geocoding)

## Apps

| App | Purpose |
|-----|---------|
| `users` | JWT auth (register/login/refresh/me) |
| `legal_twin` | Citizen digital twin — profile, documents, cases, deadlines |
| `legal_path` | Case management — legal requests, AI analysis, roadmap, timeline, lawyer recommendations |
| `directory_data` | Lawyer directory with geocoded addresses (imported/scraped) |
| `legal_writer` | Document drafting — templates, generation (AI placeholder), versioning, PDF export |

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # fill in DATABASE_URL
python manage.py migrate
python manage.py runserver
```

## API Endpoints

### Auth (`/api/auth/`)
- `POST /register/` — `{email, username, password}`
- `POST /login/` — `{email, password}` → JWT tokens
- `POST /refresh/` — `{refresh}` → new access token
- `GET /me/` — current user profile

### Legal Twin (`/api/legal/`)
- `GET/POST /profile/`
- `GET/POST /documents/` — `GET /documents/<id>/`
- `GET/POST /cases/`
- `GET/POST /deadlines/`

### Legal Path (`/api/legal-path/`)
- `GET/POST /requests/` — `GET/PUT/DELETE /requests/<id>/`
- `GET /requests/<id>/recommended_lawyers/?wilaya=&lat=&lng=`
- `GET/POST /requests/<id>/analysis/`, `roadmap-steps/`, `documents/`, `recommendations/`, `timeline/`

### Directory (`/api/directory/`)
- `GET /lawyers/` — `GET /lawyers/<id>/`

### Legal Writer (`/api/writer/`)
- `GET /templates/` — list document templates
- `GET/POST /documents/` — `GET/PUT/DELETE /documents/<id>/`
- `POST /documents/<id>/generate/` — `{"input_text": "..."}`
- `GET /documents/<id>/download/` — PDF export
- `GET /documents/<id>/versions/` — `GET /versions/<id>/`

## Seeds

```bash
python manage.py shell -c "
from legal_writer.models import DocumentTemplate
templates = [
    ('Complaint', 'Civil', 'A formal legal complaint', 'Draft a formal complaint...'),
    ('Appeal', 'Civil', 'An appeal brief', 'Draft an appeal brief...'),
    ('Administrative Request', 'Administrative', 'A request to an admin body', '...'),
    ('Power of Attorney', 'General', 'Authorizing someone to act', '...'),
    ('Employment Letter', 'Labor', 'Employment contract/termination', '...'),
    ('Court Petition', 'Civil', 'A petition to court', '...'),
    ('Rental Contract', 'Property', 'Rental/lease agreement', '...'),
    ('Demand Letter', 'Civil', 'Formal demand before legal action', '...'),
]
for name, cat, desc, hint in templates:
    DocumentTemplate.objects.get_or_create(name=name, defaults={
        'category': cat, 'description': desc, 'prompt_hint': hint
    })
"
```
