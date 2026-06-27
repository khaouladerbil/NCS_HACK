# JusticePath Memory

Last updated: 2026-06-26

## Current Build

- Fresh Vite React + TypeScript app restored.
- Git repo re-initialized.
- shadcn/ui and Prompt Kit components installed.
- HeroUI installed for top mode buttons.
- Active routes:
  - `/assistant`
  - `/settings`

## Layout Rules

- Main reusable shell in `src/components/layout/app-shell.tsx`.
- Chat feature in `src/components/chat/**`.
- Top mode switch in `src/components/modes/workspace-modes.tsx`.
- Assistant page is primary implemented route.
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
- Editor now uses a black-and-white Times New Roman document surface with a stateful floating dock, autocomplete chips, and AI suggestion chips.
- GSAP button press animation and Lenis smooth scrolling are enabled in the assistant workspace.
- Consultant now starts blank, shows prompt suggestions above the composer, and keeps user prompts unboxed.
- Lawyer cards stay hidden until the assistant stream finishes their turn.
- Editor suggestions now appear inline near the caret, and the editor can switch into viewer mode for `pdf` and `docx` files.
- Left folders now open with animated accordion motion, and the right rail stays empty until a matter begins.
- Editor now paginates long documents, supports page navigation + zoom, and keeps editing constrained to a stable page-sized writing surface.
- Left rail now exposes visible text-led actions for new document, new folder, and settings; footer settings row is clickable as a whole.
- Chat content now sits higher above the sticky composer, message editing stays in place without layout jumps, and action toasts cover more workspace actions.

## Notes

- Prompt Kit components in active use: `prompt-input`, `message`, `markdown`, `chat-container`, `scroll-button`, `source`, `text-shimmer`.
- Lightweight local motion text components added in `src/components/core/text-effect.tsx` and `src/components/core/text-shimmer-wave.tsx`.
- `motion-primitives` morphing dialog was installed, then ported into `src/components/core/morphing-dialog.tsx`.
- Browser runtime verified clean after fixing nested-button and tooltip wrapper issues from generated components.
- `npm run build` passes.
- `npm run lint` passes with existing generated-component / hook-deps warnings in shared UI primitives.
