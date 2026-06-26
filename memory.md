# JusticePath Memory

Last updated: 2026-06-26

## Current Build

- Fresh Vite React + TypeScript app restored.
- Git repo re-initialized.
- shadcn/ui and Prompt Kit components installed.
- HeroUI installed for top mode buttons.
- Active routes:
  - `/`
  - `/assistant`
  - `/settings`

## Layout Rules

- Main reusable shell in `src/components/layout/app-shell.tsx`.
- Chat feature in `src/components/chat/**`.
- Top mode switch in `src/components/modes/workspace-modes.tsx`.
- Assistant page is primary implemented route.
- Landing page now owns `/`, using a warm serif-forward legal brand presentation and routing CTAs into `/assistant`.
- Landing page now owns auth entry with a centered popup, sticky sign-in/sign-up toggle, Google option, and front-end onboarding before entering `/assistant`.
- `/auth` now redirects into the landing-page auth popup for compatibility with older CTA links.
- Settings page is routed and profile-led.
- Main content is full-screen.
- Left navigation overlays above content instead of affecting width.
- Assistant view frames JusticePath as legal assistance app, not generic chatbot.
- Top workspace bar stays sticky.
- Composer stays sticky at viewport bottom.
- Composer has upload and voice actions; reset removed.
- Lawyer recommendations render inline inside assistant answers, not as a separate panel.
- Right rail shows the legal workflow timeline.
- Editor mode now renders markdown in a single integrated paper surface, with click-anywhere editing over the live document view.
- Assistant shell uses the beige legal-review styling from the latest reference image.
- Left rail now follows the branded document-manager look with a smaller logo, icon-only new-document action, and tighter text hierarchy.
- Consultant and editor are now tied together by shared draft state; assistant actions can push text straight into the editor.
- Assistant answers now stream sequentially, follow a bottom anchor during generation, and render without answer boxes.
- Editor now uses a quieter full-screen Baskerville-style paper surface with one inline ghost suggestion and no suggestion tray chrome.
- GSAP button press animation and Lenis smooth scrolling are enabled in the assistant workspace.
- Consultant now starts blank, shows prompt suggestions above the composer, and keeps user prompts unboxed.
- Lawyer cards stay hidden until the assistant stream finishes their turn.
- Editor suggestions now appear inline near the caret, and the editor can switch into viewer mode for `pdf` and `docx` files.
- Left folders now open with animated accordion motion, and the right rail stays empty until a matter begins.
- Editor now paginates long documents, supports page navigation + zoom, and keeps editing constrained to a stable page-sized writing surface.
- Left rail now keeps settings at the bottom, with add-folder beside folder count and add-file beside each folder name.
- Chat content now sits higher above the sticky composer, message editing stays in place without layout jumps, action toasts stay centered, and assistant replies pause briefly to "think" before streaming.
- Workspace palette now uses higher-contrast neutral surfaces instead of the earlier cream-heavy treatment.
- Prompt suggestion chips now live inside the composer shell as a horizontal scroller and auto-hide once drafting begins.
- Editor right rail now swaps away from matter-tracking into document utilities, and the formatting dock now lives on the paper canvas instead of the viewport bottom.
- Editor autocomplete now renders as inline ghost text rather than a black suggestion pill.
- User-prompt editing now reloads the prompt back into the sticky composer instead of opening a brittle inline edit state.
- Left rail file actions now live in compact three-dot menus, folder chevrons follow standard collapsed/expanded direction, and long file names prefer readable wrapping over eager truncation.
- Settings now uses a compact card layout with a single-column profile form and left-aligned save flow.
- Consultant header now hides empty file subtitle, prompt streaming can be stopped mid-generation, and sidebar toggle pills now peek out while closed.
- Left rail now supports double-click folder rename, add-file buttons next to folder names, slightly larger folder labels, smaller file labels, and drag-handle file moves/reordering.
- Editor now uses stacked page canvases with zoom scaling the page itself, a pill-style top toolbar, clickable TOC wiring through the right rail, and real sample PDF/DOCX assets in `public/test-docs/`.
- Editor toolbar now exposes direct DOCX and PDF export actions.
- Professor mode now shows study modules as expandable visual cards instead of an empty placeholder.
- Folder and file creation now use a local centered dialog component instead of `window.prompt`.
- Consultant top-left header metadata now hides entirely when no file is active.
- Folder rename now works directly in place on double-click, while editor TOC clicks jump and autoscroll for markdown, PDF, and DOCX-backed views.
- Closed-folder headers now act as file drop targets, so dragged files can move into collapsed folders.
- Sidebar folder count keeps a compact add-folder icon beside it; folder labels are larger and file labels are smaller.
- Sidebar file rows now show file-type badges/colors and require confirmation before file or folder deletion.
- Settings page now reuses the same sidebar chrome/components as the assistant workspace.
- Editor formatting controls now flank the always-centered mode tabs, sharing the same pill/tab button styling.
- Editor now uses a more premium docs-style paper system with typography-scaled zoom, inline ghost autocomplete at the caret, completion chips, and Pretext-backed text measurement.
- Consultant now uses the shared refined beige/gold system with stronger typography and Pretext-backed reserved heights for streamed legal answer paragraphs.

## Notes

- Prompt Kit components in active use: `prompt-input`, `message`, `markdown`, `chat-container`, `scroll-button`, `source`, `text-shimmer`.
- `@chenglou/pretext` is installed and wrapped by `src/lib/pretext.ts`; shared width observation lives in `src/hooks/use-element-width.ts`.
- Lightweight local motion text components added in `src/components/core/text-effect.tsx` and `src/components/core/text-shimmer-wave.tsx`.
- `motion-primitives` morphing dialog was installed, then ported into `src/components/core/morphing-dialog.tsx`.
- Browser runtime verified clean after fixing nested-button and tooltip wrapper issues from generated components.
- `npm run build` passes.
- `npm run lint` passes with existing generated-component / hook-deps warnings in shared UI primitives.
