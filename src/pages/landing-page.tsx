import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { gsap } from "gsap"
import Lenis from "lenis"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FilePenLine,
  FolderSearch,
  GraduationCap,
  LockKeyhole,
  Menu,
  MessageSquareText,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react"

import { AuthDialog, type AuthMode } from "@/components/auth/auth-dialog"
import { ChatComposer } from "@/components/chat/chat-composer"
import { LegalOrbitScene } from "@/components/website/legal-orbit-scene"
import logoMark from "../../Logo.svg"

const navItems = [
  { label: "Platform", href: "#platform" },
  { label: "Workflow", href: "#workflow" },
  { label: "Trust", href: "#trust" },
  { label: "Access", href: "#access" },
]

const workflowSteps = [
  {
    step: "01",
    title: "Upload the record",
    body: "Drop a lease, brief, NDA, demand letter, or scanned evidence into one matter workspace.",
    icon: UploadCloud,
  },
  {
    step: "02",
    title: "Map the legal path",
    body: "JusticePath extracts deadlines, clauses, filings, and missing facts before drafting begins.",
    icon: FolderSearch,
  },
  {
    step: "03",
    title: "Draft from source",
    body: "Move the answer into an A4 editor with clause-level context, export, and review handoff.",
    icon: FileCheck2,
  },
]

const modeStories = [
  {
    mode: "Consultant",
    title: "Answers that keep the clause in view.",
    body: "Ask the question you would normally save for intake. The assistant responds in plain legal-review language, then preserves the source trail.",
    icon: MessageSquareText,
  },
  {
    mode: "Editor",
    title: "A legal document surface, not a text box.",
    body: "Draft letters, petitions, and contract revisions on a quiet page with inline suggestions and DOCX/PDF export.",
    icon: FilePenLine,
  },
  {
    mode: "Professor",
    title: "Learn the rule while working the matter.",
    body: "Turn the same facts into guided checkpoints so legal doctrine becomes usable instead of abstract.",
    icon: GraduationCap,
  },
]

const proofPoints = [
  "PDF and DOCX-aware workspace",
  "Inline lawyer recommendations after answers finish",
  "Clause, deadline, and next-action extraction",
  "Editor exports for DOCX and PDF handoff",
]

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [heroPrompt, setHeroPrompt] = useState("")
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("signup")
  const [searchParams, setSearchParams] = useSearchParams()
  const heroRef = useRef<HTMLElement | null>(null)
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const heroSceneY = useTransform(scrollYProgress, [0, 1], [0, 170])
  const heroCopyY = useTransform(scrollYProgress, [0, 1], [0, -58])
  const heroSignalY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const heroComposerY = useTransform(scrollYProgress, [0, 1], [0, 42])

  function openAuthDialog(nextMode: AuthMode) {
    setAuthMode(nextMode)
    setAuthDialogOpen(true)
    setSearchParams({ auth: nextMode }, { replace: true })
  }

  function closeAuthDialog() {
    setAuthDialogOpen(false)
    setSearchParams({}, { replace: true })
  }

  function handleDemoSubmit() {
    setShowLoginPrompt(true)
    openAuthDialog("signup")
  }

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
    })

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = window.requestAnimationFrame(raf)
    }

    rafId = window.requestAnimationFrame(raf)

    const clickableSelector = "button, a, [role='button']"
    const handlePointerDown = (event: Event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(clickableSelector)
      if (!target) return

      gsap.fromTo(
        target,
        { scale: 1 },
        {
          scale: 0.975,
          duration: 0.08,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
          overwrite: true,
        }
      )
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      window.cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = mobileMenuOpen ? "hidden" : previousOverflow

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const closeMenu = () => setMobileMenuOpen(false)
    window.addEventListener("resize", closeMenu)

    return () => window.removeEventListener("resize", closeMenu)
  }, [mobileMenuOpen])

  useEffect(() => {
    const requestedAuth = searchParams.get("auth")
    if (requestedAuth === "signin" || requestedAuth === "signup") {
      setAuthMode(requestedAuth)
      setAuthDialogOpen(true)
      return
    }

    setAuthDialogOpen(false)
  }, [searchParams])

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5efe2] text-[#1c1711] selection:bg-[#d6a850] selection:text-[#15110d]">
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setAuthDialogOpen(true)
            return
          }

          closeAuthDialog()
        }}
        initialMode={authMode}
      />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#15110d]/78 text-[#fff8eb] shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3 text-[#fff8eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6a850]"
          >
            <img src={logoMark} alt="JusticePath" className="h-10 w-auto sm:h-11" />
            <span className="font-editor text-2xl leading-none sm:text-3xl">
              JusticePath
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#d8cbb7] md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6a850]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => openAuthDialog("signin")}
              className="min-h-11 rounded-full px-4 text-sm font-semibold text-[#f2e4cd] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6a850]"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => openAuthDialog("signup")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#d6a850] px-5 text-sm font-bold text-[#15110d] shadow-[0_14px_34px_rgba(214,168,80,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#efc878] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fff8eb]"
            >
              Open workspace
              <ArrowRight className="size-4" />
            </button>
          </div>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/8 text-[#fff8eb] backdrop-blur md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-white/10 bg-[#15110d] px-4 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-lg px-4 py-3 text-sm font-semibold text-[#e8dcc8] transition-colors hover:bg-white/8"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  openAuthDialog("signin")
                }}
                className="rounded-lg border border-white/12 px-4 py-3 text-left text-sm font-semibold text-[#fff8eb]"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  openAuthDialog("signup")
                }}
                className="rounded-lg bg-[#d6a850] px-4 py-3 text-left text-sm font-bold text-[#15110d]"
              >
                Open workspace
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <main id="main-content">
        <section
          ref={heroRef}
          className="relative isolate min-h-[92dvh] overflow-hidden bg-[#15110d] text-[#fff8eb]"
        >
          <motion.div style={shouldReduceMotion ? undefined : { y: heroSceneY }}>
            <LegalOrbitScene className="opacity-45" />
          </motion.div>
          <div className="landing-hero-minimal absolute inset-0" />

          <motion.div
            aria-hidden="true"
            style={shouldReduceMotion ? undefined : { y: heroSignalY }}
            className="absolute inset-x-4 top-28 z-10 mx-auto hidden max-w-7xl justify-between text-xs font-semibold uppercase text-[#d6a850]/55 md:flex"
          >
            <span>evidence</span>
            <span>draft</span>
            <span>counsel</span>
          </motion.div>

          <div className="relative z-10 mx-auto flex min-h-[92dvh] max-w-5xl flex-col items-center justify-center px-4 pb-20 pt-28 text-center sm:px-6 lg:px-8">
            <motion.div
              style={shouldReduceMotion ? undefined : { y: heroCopyY }}
              className="w-full max-w-4xl"
            >
              <p className="mb-8 text-sm font-semibold uppercase text-[#d6a850]">
                Legal AI workspace
              </p>

              <h1 className="font-editor text-7xl leading-[0.82] text-white sm:text-8xl lg:text-[9.5rem]">
                JusticePath
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-balance text-2xl leading-tight text-[#f2e6d1] sm:text-4xl">
                Ask the legal question. Keep the clause, draft, and next step in one place.
              </p>
              <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#d6c7b3] sm:text-lg">
                Minimal surface. Real matter context. Powered by proprietary models.
              </p>
            </motion.div>

            <motion.div
              style={shouldReduceMotion ? undefined : { y: heroComposerY }}
              className="mt-10 w-full max-w-2xl"
            >
              <ChatComposer
                draft={heroPrompt}
                loading={false}
                onDraftChange={setHeroPrompt}
                onSubmit={handleDemoSubmit}
              />

              {showLoginPrompt ? (
                <p className="mt-4 text-sm font-medium text-[#d8cbb7]">
                  Create a workspace to continue with this matter.
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold text-[#c9baa4]">
                <button
                  type="button"
                  onClick={() => openAuthDialog("signup")}
                  className="inline-flex items-center gap-2 text-[#f3d18c] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6a850]"
                >
                  Start a matter
                  <ArrowRight className="size-4" />
                </button>
                <Link
                  to="/assistant"
                  className="inline-flex items-center gap-2 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6a850]"
                >
                  View workspace
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section
          id="platform"
          className="relative overflow-hidden border-y border-[#ddcfb7] bg-[#f5efe2] px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-14"
        >
          <div className="mx-auto mb-12 flex max-w-7xl flex-col gap-2 border-b border-[#d8c8ab] pb-4 text-sm font-semibold text-[#5a4b3a] sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[#8b642b]">Platform</span>
            <span>Upload record / map legal path / draft from source</span>
          </div>

          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <Reveal>
              <p className="text-sm font-bold uppercase text-[#8b642b]">
                Platform
              </p>
              <h2 className="mt-4 max-w-xl font-editor text-5xl leading-[0.95] text-[#17120d] sm:text-6xl">
                Legal work needs memory, not more tabs.
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-[#5a4b3a]">
                JusticePath keeps consultation, document review, drafting, and study
                attached to the same matter record.
              </p>
            </Reveal>

            <div className="grid gap-4 md:grid-cols-3">
              {workflowSteps.map((item, index) => {
                const Icon = item.icon

                return (
                  <Reveal key={item.step} delay={index * 0.08}>
                    <article className="h-full rounded-lg border border-[#d8c8ab] bg-[#fffaf0] p-6 shadow-[0_18px_48px_rgba(60,42,18,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(60,42,18,0.12)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#9e742f]">
                          {item.step}
                        </span>
                        <Icon className="size-5 text-[#315a79]" />
                      </div>
                      <h3 className="mt-10 text-xl font-bold text-[#17120d]">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-base leading-7 text-[#61523f]">
                        {item.body}
                      </p>
                    </article>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="bg-[#17120d] px-4 py-20 text-[#fff8eb] sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal className="lg:sticky lg:top-28 lg:h-fit">
              <p className="text-sm font-bold uppercase text-[#d6a850]">
                Workflow
              </p>
              <h2 className="mt-4 max-w-xl font-editor text-5xl leading-[0.95] text-white sm:text-6xl">
                Three modes. One evidence trail.
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-[#d8cbb7]">
                The product does not reset when the task changes. Guidance, drafting,
                and learning share the same legal context.
              </p>
            </Reveal>

            <div className="space-y-4">
              {modeStories.map((item, index) => {
                const Icon = item.icon

                return (
                  <Reveal key={item.mode} delay={index * 0.08}>
                    <article className="group rounded-lg border border-white/10 bg-white/[0.045] p-6 transition duration-300 hover:border-[#d6a850]/40 hover:bg-white/[0.075] sm:p-8">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#d6a850]/15 text-[#f2cd81]">
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold uppercase text-[#a4eadf]">
                            {item.mode}
                          </p>
                          <h3 className="mt-3 text-2xl font-bold text-white">
                            {item.title}
                          </h3>
                          <p className="mt-4 max-w-2xl text-base leading-7 text-[#d8cbb7]">
                            {item.body}
                          </p>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        <section
          id="trust"
          className="relative overflow-hidden bg-[#fffaf0] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-[#d8c8ab]" />
          <div className="mx-auto max-w-7xl">
            <Reveal className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-end">
              <div>
                <p className="text-sm font-bold uppercase text-[#8b642b]">
                  Trust
                </p>
                <h2 className="mt-4 max-w-3xl font-editor text-5xl leading-[0.95] text-[#17120d] sm:text-6xl">
                  Serious by default. Clear when it must hand off.
                </h2>
              </div>
              <p className="max-w-xl text-lg leading-8 text-[#5a4b3a]">
                JusticePath is positioned as legal assistance, not a replacement for
                counsel. It organizes facts, drafts, and recommendations so a human
                reviewer starts from something coherent.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-[#d8c8ab] bg-[#d8c8ab] md:grid-cols-2">
              {proofPoints.map((point, index) => (
                <Reveal key={point} delay={index * 0.05}>
                  <div className="flex min-h-28 items-center gap-4 bg-[#fffaf0] p-6">
                    <CheckCircle2 className="size-5 shrink-0 text-[#2e746a]" />
                    <span className="text-lg font-semibold text-[#21180f]">
                      {point}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-16 grid gap-6 lg:grid-cols-3">
              <TrustMetric
                icon={<ShieldCheck className="size-5" />}
                label="Positioning"
                value="Assistance first"
                body="Terse legal workflow copy, explicit handoff language, and no fake guarantees."
              />
              <TrustMetric
                icon={<LockKeyhole className="size-5" />}
                label="Workspace"
                value="Matter-scoped"
                body="Documents, prompts, drafts, and recommendations stay tied to one case context."
              />
              <TrustMetric
                icon={<BrainCircuit className="size-5" />}
                label="Models"
                value="Proprietary"
                body="Built around JusticePath modes rather than a generic chat wrapper."
              />
            </Reveal>
          </div>
        </section>

        <section
          id="access"
          className="relative overflow-hidden bg-[#213a5e] px-4 py-20 text-[#fff8eb] sm:px-6 lg:px-8"
        >
          <div className="absolute inset-0 landing-crosshatch opacity-20" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <Reveal>
              <p className="text-sm font-bold uppercase text-[#a4eadf]">
                Access
              </p>
              <h2 className="mt-4 max-w-3xl font-editor text-5xl leading-[0.95] text-white sm:text-6xl">
                Open a matter. Bring the messy file.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#dce8f1]">
                The landing page now points straight into the live workspace, with auth
                handled in place and the product surface doing the selling.
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  onClick={() => openAuthDialog("signup")}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#fff8eb] px-6 text-base font-bold text-[#17243a] transition duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6a850]"
                >
                  Create workspace
                  <ArrowRight className="size-5" />
                </button>
                <Link
                  to="/assistant"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/24 px-6 text-base font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Enter product
                  <BookOpenText className="size-5" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d8c8ab] bg-[#f5efe2] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-[#17120d]">
            <img src={logoMark} alt="" className="h-10 w-auto" />
            <span className="font-editor text-3xl leading-none">JusticePath</span>
          </div>

          <p className="max-w-lg text-sm leading-6 text-[#5a4b3a]">
            Legal assistance powered by proprietary models. Human review still matters.
          </p>

          <div className="flex flex-wrap items-center gap-5 text-sm font-semibold text-[#3b2e20]">
            <a href="#trust" className="transition-colors hover:text-[#17120d]">
              Trust
            </a>
            <Link to="/settings" className="transition-colors hover:text-[#17120d]">
              Settings
            </Link>
            <button
              type="button"
              onClick={() => openAuthDialog("signup")}
              className="inline-flex items-center gap-1 text-[#17120d]"
            >
              Open app
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 34 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function TrustMetric({
  icon,
  label,
  value,
  body,
}: {
  icon: ReactNode
  label: string
  value: string
  body: string
}) {
  return (
    <article className="rounded-lg border border-[#d8c8ab] bg-[#f5efe2] p-6">
      <div className="flex items-center gap-3 text-[#315a79]">
        {icon}
        <span className="text-xs font-bold uppercase">
          {label}
        </span>
      </div>
      <h3 className="mt-7 text-2xl font-bold text-[#17120d]">{value}</h3>
      <p className="mt-3 text-base leading-7 text-[#5a4b3a]">{body}</p>
    </article>
  )
}
