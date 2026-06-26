# JusticePath Agent Notes

## Structure

- Reusable UI in `src/components/**`.
- Route entry pages in `src/pages/**`.
- Shared data in `src/data/**`.
- Shared hooks in `src/hooks/**`.
- Shared types in `src/types/**`.
- Shared helpers in `src/lib/**`.

## Current Direction

- Rebuilt as minimal React app.
- Prompt Kit components drive chat surface.
- Main content is chat only.
- Top mode switch uses HeroUI buttons.
- Modes: consultant, editor, professor.
- Consultant shows chat; editor/professor stay empty until later.
- Prompt input stays sticky at bottom.
- Input actions: upload + voice.
- Left navigation overlays content and must collapse/expand correctly.
- Settings uses full page route, not sheet.
- Brand as legal assistance app powered by proprietary models.
- Copy should stay terse.

## Workflow

- Update `AGENTS.md` and `memory.md` after meaningful changes.
- Commit each completed prompt.
