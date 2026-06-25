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
- Main content owns full viewport.
- Left navigation floats above content and does not reserve layout space.
- Copy should stay terse.

## Workflow

- Update `AGENTS.md` and `memory.md` after meaningful changes.
- Commit each completed prompt.
