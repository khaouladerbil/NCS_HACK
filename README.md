# JusticePath

Full-stack legal workspace combining:

- React/Vite frontend for AI-assisted legal drafting and review
- Django + DRF backend for auth, legal workflows, directory data, and document services

## Frontend

- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Prompt Kit

Commands:

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Backend

- Django
- Django REST Framework
- JWT auth
- Document and legal workflow apps

Commands:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Backend Apps

- `users` auth and profile endpoints
- `legal_twin` citizen profile, documents, cases, deadlines
- `legal_path` legal requests, analysis, roadmap, recommendations
- `directory_data` lawyer directory import and APIs
- `legal_writer` template-driven drafting and versioning

## Notes

- Frontend conventions live in `AGENTS.md` and `memory.md`
- Sample review docs live in `public/test-docs/`
