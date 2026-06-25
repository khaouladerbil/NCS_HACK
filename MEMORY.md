# MEMORY.md

## Decisions

- 2026-06-25: Project uses React 19, Vite 8, Tailwind v4, shadcn-ready config, Lenis, GSAP, and lucide-react.
- 2026-06-25: JusticePath visual system is the source of truth: paper background, espresso text, sun/sand accents, editorial serif headings, restrained motion.
- 2026-06-25: Creative Tim `sidebar-with-task-manager` requires an API key; `components.json` includes registry auth config for `CREATIVE_TIM_UI_API_KEY`.
- 2026-06-25: AI chat dashboard should use existing PromptKit-style local components first: `FileUpload`, `PromptInput`, `PromptInputTextarea`, `PromptInputActions`, `PromptInputAction`.

## Current State

- 2026-06-25: Main app renders an AI legal chat dashboard with sidebar task manager, chat transcript, document upload chips, prompt input, and saved references.

## Verification

- 2026-06-25: `npm run lint` passed after dashboard implementation.
- 2026-06-25: `npm run build` passed after dashboard implementation.
- 2026-06-25: `http://localhost:5173/` returned HTTP 200 during surface check.

## Known Gaps

- Prompt Kit and Creative Tim remote registry installs are blocked without available DNS/API key conditions.
