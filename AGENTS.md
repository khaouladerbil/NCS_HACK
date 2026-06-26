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
- Consultant shows chat; editor is a single-surface in-place markdown document view for now; professor stays empty until later.
- Prompt input stays sticky at bottom.
- Input actions: upload + voice.
- Left navigation overlays content and must collapse/expand correctly.
- Settings uses full page route, not sheet.
- Brand as legal assistance app powered by proprietary models.
- Lawyer suggestions should appear inline as part of assistant answers.
- Right sidebar currently serves the legal workflow timeline.
- Editor mode should feel like reviewing a printed legal document on A4 paper.
- Editor now uses a monochrome Times New Roman paper treatment with a floating formatting dock that tracks active formatting, plus inline suggestion chips.
- Assistant answers should stream sequentially, auto-scroll while generating, and avoid boxed answer chrome.
- Sidebar content should stay compact, hierarchy-led, and centered on typography over cards.
- Consultant mode should open in a mostly blank state until the user prompts it.
- Prompt suggestions belong above the composer; editor suggestions belong inline near the caret, not in a bottom tray.
- Lawyer recommendation cards should appear only after the relevant assistant turn finishes streaming.
- The editor should support read-only viewer treatment for `pdf` and `docx` selections in addition to draft editing.
- The editor now also needs paginated read/edit flow with zoom while keeping page height stable.
- Consultant surface currently follows a warm beige legal-review visual language.
- Copy should stay terse.

## Workflow

- Update `AGENTS.md` and `memory.md` after meaningful changes.
- Commit each completed prompt.
