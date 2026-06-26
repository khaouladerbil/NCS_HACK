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
- Editor now uses a monochrome Times New Roman paper treatment with inline suggestion chips and topbar formatting pills that mirror the mode tabs.
- Assistant answers should stream sequentially, auto-scroll while generating, and avoid boxed answer chrome.
- Sidebar content should stay compact, hierarchy-led, and centered on typography over cards.
- Sidebar file labels should prefer readable wrapping or wider rails over aggressive truncation.
- File-row secondary actions should prefer compact context menus over persistent hover-icon clutter.
- Consultant mode should open in a mostly blank state until the user prompts it.
- Prompt suggestions belong above the composer; editor suggestions belong inline near the caret, not in a bottom tray.
- Lawyer recommendation cards should appear only after the relevant assistant turn finishes streaming.
- The editor should support read-only viewer treatment for `pdf` and `docx` selections in addition to draft editing.
- The editor now also needs paginated read/edit flow with zoom while keeping page height stable.
- Editor mode should repurpose the right rail into document utilities such as outline/comments/history rather than consultant matter tracking.
- Sidebar toggle pills should stay visible by peeking slightly outside closed rails.
- Folder rows should allow double-click rename, adjacent add-file action, and lightweight drag-drop without busy chrome.
- Sample PDF/DOCX assets in `public/test-docs/` back editor/viewer testing.
- Folder/file creation should use modal dialog UI rather than browser prompt UI.
- Consultant header should go visually silent when no file context exists.
- Closed folder headers should still accept dragged files for move operations.
- Editor formatting controls should share the same topbar pill-button language as mode tabs and stay visually attached to the centered mode tabs.
- Consultant surface currently follows a warm beige legal-review visual language.
- Editor should now read as a premium alt-Google-Docs surface: editorial serif paper, inline autocomplete at caret, and zoom that scales real layout instead of distorting input chrome.
- Pretext-backed text measurement should be part of the workspace text stack, especially in consultant streaming and editor text layout behavior.
- `/` is now a marketing landing page; `/assistant` remains the main product workspace route.
- Auth now opens as a landing-page popup with sticky sign-in/sign-up controls; `/auth` only redirects into that popup state for compatibility.
- Copy should stay terse.
- Toasts should stay centered across the workspace.
- Editor should stay visually quiet: full-screen paper, one inline suggestion only, and explicit DOCX/PDF export.
- File rows should stay type-aware, with smaller labels and confirmation before destructive deletion.

## Workflow

- Update `AGENTS.md` and `memory.md` after meaningful changes.
- Commit each completed prompt.
