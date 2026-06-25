import { useState } from 'react'
import { ArrowUp, FileText, LayoutPanelTop, LibraryBig, LogIn, UserRoundPlus } from 'lucide-react'
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/prompt-kit'

type AppPage = 'landing' | 'login' | 'signup' | 'onboarding' | 'platform'
type PlatformTab = 'consultant' | 'professor'

const onboardingSteps = [
  'Profile details',
  'Jurisdiction',
  'Learning goals',
  'Document permissions',
]

const consultantSidebarItems = [
  'Documents placeholder',
  'Important dates placeholder',
  'Pinned facts placeholder',
  'Case folders placeholder',
]

const reasoningItems = [
  'Reasoning trace placeholder',
  'Citations placeholder',
  'Sources placeholder',
  'Follow-up actions placeholder',
]

const learningUnits = [
  'Unit 1 placeholder',
  'Unit 2 placeholder',
  'Unit 3 placeholder',
  'Unit 4 placeholder',
  'Checkpoint placeholder',
]

function App() {
  const [page, setPage] = useState<AppPage>('landing')
  const [platformTab, setPlatformTab] = useState<PlatformTab>('consultant')
  const [consultantInput, setConsultantInput] = useState('')

  return (
    <main className="min-h-dvh bg-[var(--color-paper)] text-[var(--color-espresso)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col px-4 py-6 md:px-8">
        <header className="flex flex-col gap-4 border-b border-[var(--color-paper-200)] pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-3xl">JusticePath</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-espresso-500)]">
              App skeleton only
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPage('landing')}
              className="rounded-[var(--radius-md)] border border-[var(--color-paper-300)] px-3 py-2 text-sm"
            >
              Landing
            </button>
            <button
              type="button"
              onClick={() => setPage('login')}
              className="rounded-[var(--radius-md)] border border-[var(--color-paper-300)] px-3 py-2 text-sm"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setPage('signup')}
              className="rounded-[var(--radius-md)] border border-[var(--color-paper-300)] px-3 py-2 text-sm"
            >
              Signup
            </button>
            <button
              type="button"
              onClick={() => setPage('onboarding')}
              className="rounded-[var(--radius-md)] border border-[var(--color-paper-300)] px-3 py-2 text-sm"
            >
              Onboarding
            </button>
            <button
              type="button"
              onClick={() => setPage('platform')}
              className="rounded-[var(--radius-md)] border border-[var(--color-paper-300)] px-3 py-2 text-sm"
            >
              Platform
            </button>
          </nav>
        </header>

        <section className="flex-1 py-6">
          {page === 'landing' ? <LandingPage onStart={() => setPage('signup')} /> : null}
          {page === 'login' ? <AuthPage mode="login" onNext={() => setPage('platform')} /> : null}
          {page === 'signup' ? <AuthPage mode="signup" onNext={() => setPage('onboarding')} /> : null}
          {page === 'onboarding' ? <OnboardingPage onFinish={() => setPage('platform')} /> : null}
          {page === 'platform' ? (
            <PlatformPage
              tab={platformTab}
              onTabChange={setPlatformTab}
              consultantInput={consultantInput}
              onConsultantInputChange={setConsultantInput}
            />
          ) : null}
        </section>
      </div>
    </main>
  )
}

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <section className="grid gap-4">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-paper-200)] bg-white p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-espresso-500)]">
          Landing page
        </p>
        <h1 className="mt-2 font-display text-4xl">Placeholder only</h1>
        <p className="mt-3 text-sm text-[var(--color-espresso-500)]">
          Future marketing, product framing, and entry actions live here.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-paper-300)] px-4 py-2 text-sm"
        >
          Go to signup placeholder
        </button>
      </div>
    </section>
  )
}

function AuthPage({
  mode,
  onNext,
}: {
  mode: 'login' | 'signup'
  onNext: () => void
}) {
  return (
    <section className="mx-auto max-w-[520px] rounded-[var(--radius-lg)] border border-[var(--color-paper-200)] bg-white p-6">
      <div className="flex items-center gap-3">
        {mode === 'login' ? <LogIn className="size-5" strokeWidth={1.5} /> : <UserRoundPlus className="size-5" strokeWidth={1.5} />}
        <h1 className="font-display text-3xl">{mode === 'login' ? 'Login' : 'Signup'} placeholder</h1>
      </div>
      <div className="mt-6 grid gap-3">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-paper-200)] p-3 text-sm">
          Email field placeholder
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-paper-200)] p-3 text-sm">
          Password field placeholder
        </div>
        {mode === 'signup' ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-paper-200)] p-3 text-sm">
            Confirm password placeholder
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-paper-300)] px-4 py-2 text-sm"
      >
        Continue
      </button>
    </section>
  )
}

function OnboardingPage({ onFinish }: { onFinish: () => void }) {
  return (
    <section className="grid gap-4">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-paper-200)] bg-white p-6">
        <div className="flex items-center gap-3">
          <LayoutPanelTop className="size-5" strokeWidth={1.5} />
          <h1 className="font-display text-3xl">Onboarding placeholder</h1>
        </div>
        <div className="mt-6 grid gap-3">
          {onboardingSteps.map((step, index) => (
            <div
              key={step}
              className="rounded-[var(--radius-md)] border border-[var(--color-paper-200)] p-4 text-sm"
            >
              Step {index + 1}: {step}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onFinish}
          className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-paper-300)] px-4 py-2 text-sm"
        >
          Finish onboarding
        </button>
      </div>
    </section>
  )
}

function PlatformPage({
  tab,
  onTabChange,
  consultantInput,
  onConsultantInputChange,
}: {
  tab: PlatformTab
  onTabChange: (tab: PlatformTab) => void
  consultantInput: string
  onConsultantInputChange: (value: string) => void
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onTabChange('consultant')}
          className="rounded-[var(--radius-md)] border border-[var(--color-paper-300)] px-4 py-2 text-sm"
        >
          Consultant
        </button>
        <button
          type="button"
          onClick={() => onTabChange('professor')}
          className="rounded-[var(--radius-md)] border border-[var(--color-paper-300)] px-4 py-2 text-sm"
        >
          Professor
        </button>
      </div>

      {tab === 'consultant' ? (
        <ConsultantTab
          consultantInput={consultantInput}
          onConsultantInputChange={onConsultantInputChange}
        />
      ) : (
        <ProfessorTab />
      )}
    </section>
  )
}

function ConsultantTab({
  consultantInput,
  onConsultantInputChange,
}: {
  consultantInput: string
  onConsultantInputChange: (value: string) => void
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_280px]">
      <aside className="rounded-[var(--radius-lg)] border border-[var(--color-paper-200)] bg-white p-4">
        <div className="flex items-center gap-2">
          <FileText className="size-4" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold">Sidebar placeholder</h2>
        </div>
        <div className="mt-4 grid gap-2">
          {consultantSidebarItems.map((item) => (
            <div
              key={item}
              className="rounded-[var(--radius-md)] border border-[var(--color-paper-200)] p-3 text-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </aside>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-paper-200)] bg-white p-4">
        <div className="border-b border-[var(--color-paper-200)] pb-4">
          <h2 className="text-sm font-semibold">Main chatbot interface placeholder</h2>
        </div>
        <div className="grid gap-3 py-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-paper-200)] p-3 text-sm">
            Assistant message placeholder
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-paper-200)] p-3 text-sm">
            User message placeholder
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-paper-200)] p-3 text-sm">
            More conversation placeholder
          </div>
        </div>

        <PromptInput className="mt-4">
          <PromptInputTextarea
            value={consultantInput}
            onChange={(event) => onConsultantInputChange(event.target.value)}
            placeholder="Chat input placeholder"
          />
          <PromptInputActions>
            <span className="text-sm text-[var(--color-espresso-500)]">
              Input logic placeholder
            </span>
            <button
              type="button"
              className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-paper-300)] px-4 text-sm"
            >
              Send
              <ArrowUp className="size-4" strokeWidth={1.5} />
            </button>
          </PromptInputActions>
        </PromptInput>
      </section>

      <aside className="rounded-[var(--radius-lg)] border border-[var(--color-paper-200)] bg-white p-4">
        <h2 className="text-sm font-semibold">Reasoning panel placeholder</h2>
        <div className="mt-4 grid gap-2">
          {reasoningItems.map((item) => (
            <div
              key={item}
              className="rounded-[var(--radius-md)] border border-[var(--color-paper-200)] p-3 text-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </aside>
    </section>
  )
}

function ProfessorTab() {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-paper-200)] bg-white p-4">
      <div className="flex items-center gap-2">
        <LibraryBig className="size-5" strokeWidth={1.5} />
        <h2 className="text-sm font-semibold">Professor journey placeholder</h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {learningUnits.map((unit) => (
          <div
            key={unit}
            className="rounded-[var(--radius-md)] border border-[var(--color-paper-200)] p-4 text-sm"
          >
            {unit}
          </div>
        ))}
      </div>
    </section>
  )
}

export default App
