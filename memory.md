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
- Editor mode now renders markdown as legal-document A4 paper with a live source editor.
- Assistant shell uses the beige legal-review styling from the latest reference image.

## Notes

- Prompt Kit components in active use: `prompt-input`, `message`, `markdown`, `chat-container`, `scroll-button`, `source`, `text-shimmer`.
- Lightweight local motion text components added in `src/components/core/text-effect.tsx` and `src/components/core/text-shimmer-wave.tsx`.
- `motion-primitives` morphing dialog was installed, then ported into `src/components/core/morphing-dialog.tsx`.
- Browser runtime verified clean after fixing nested-button and tooltip wrapper issues from generated components.
- `npm run build` passes.
- `npm run lint` passes with existing shadcn fast-refresh warnings in generated primitives.
