# JusticePath Memory

Last updated: 2026-06-25

## Current Build

- Fresh Vite React + TypeScript app restored.
- Git repo re-initialized.
- shadcn/ui and Prompt Kit components installed.
- Single active route:
  - `/assistant`

## Layout Rules

- Main reusable shell in `src/components/layout/app-shell.tsx`.
- Chat feature in `src/components/chat/**`.
- Assistant page is primary implemented route.
- Main content is full-screen.
- Left navigation overlays above content instead of affecting width.
- Visible content is message stream only.
- Composer floats at viewport bottom.

## Notes

- Prompt Kit components in active use: `prompt-input`, `message`, `markdown`, `chat-container`, `scroll-button`, `source`, `text-shimmer`.
- Browser runtime verified clean after fixing nested-button and tooltip wrapper issues from generated components.
- `npm run build` passes.
- `npm run lint` passes with existing shadcn fast-refresh warnings in generated primitives.
