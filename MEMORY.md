# MEMORY.md

## Decisions

- 2026-06-25: Project uses React 19, Vite 8, Tailwind v4, shadcn-ready config, Lenis, GSAP, and lucide-react.
- 2026-06-25: JusticePath visual system is the source of truth: paper background, espresso text, sun/sand accents, editorial serif headings, restrained motion.
- 2026-06-25: Creative Tim `sidebar-with-task-manager` requires an API key; `components.json` includes registry auth config for `CREATIVE_TIM_UI_API_KEY`.
- 2026-06-25: AI chat dashboard should use existing PromptKit-style local components first: `FileUpload`, `PromptInput`, `PromptInputTextarea`, `PromptInputActions`, `PromptInputAction`.
- 2026-06-25: Current pass removes rich dashboard implementation and keeps page logic plus placeholders only.

## Current State

- 2026-06-25: Main app now defines landing, login, signup, onboarding, and platform states.
- 2026-06-25: Platform has `consultant` and `professor` tabs.
- 2026-06-25: Consultant tab uses 3 placeholder columns: left sidebar, middle chatbot, right reasoning/citations/sources panel.
- 2026-06-25: Professor tab is a Duolingo-style learning journey placeholder grid.

## Verification

- 2026-06-25: `npm run lint` passed after dashboard implementation.
- 2026-06-25: `npm run build` passed after dashboard implementation.
- 2026-06-25: `http://localhost:5173/` returned HTTP 200 during surface check.
- 2026-06-25: `npm run lint` passed after placeholder-page refactor.
- 2026-06-25: `npm run build` passed after placeholder-page refactor.

## Known Gaps

- Prompt Kit and Creative Tim remote registry installs are blocked without available DNS/API key conditions.
