import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
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
  Mic,
  Paperclip,
  Scale,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react"

import { AuthDialog, type AuthMode } from "@/components/auth/auth-dialog"
import { TextEffect } from "@/components/core/text-effect"
import { Button } from "@/components/ui/button"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { LegalOrbitScene } from "@/components/website/legal-orbit-scene"
import { cn } from "@/lib/utils"
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

const caseLines = [
  { label: "Uploaded", value: "Service agreement.pdf", tone: "gold" },
  { label: "Found", value: "30-day notice window", tone: "blue" },
  { label: "Risk", value: "Termination penalty needs review", tone: "red" },
  { label: "Next", value: "Draft reply before filing", tone: "green" },
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
  const heroSceneY = useTransform(scrollYProgress, [0, 1], [0, 130])
  const heroCopyY = useTransform(scrollYProgress, [0, 1], [0, -42])

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
          <LegalOrbitScene className="opacity-90" />
          <div className="landing-hero-vignette absolute inset-0" />
          <div className="landing-technical-grid absolute inset-0 opacity-[0.18]" />

          <div className="relative z-10 mx-auto grid min-h-[92dvh] max-w-7xl items-start gap-10 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:pt-32">
            <motion.div
              style={shouldReduceMotion ? undefined : { y: heroCopyY }}
              className="max-w-3xl"
            >
              <div className="mb-7 inline-flex items-center gap-3 border border-[#d6a850]/35 bg-[#d6a850]/10 px-4 py-2 text-xs font-bold uppercase text-[#f4d696] backdrop-blur">
                <Sparkles className="size-4" />
                Legal AI workspace
              </div>

              <h1 className="font-editor text-6xl leading-[0.86] text-white sm:text-8xl lg:text-[9.5rem] xl:text-[10.5rem]">
                JusticePath
              </h1>
              <p className="mt-7 max-w-2xl text-balance text-2xl leading-tight text-[#f2e6d1] sm:text-4xl">
                From first upload to lawyer-ready draft, without losing the clause.
              </p>
              <p className="mt-6 max-w-xl text-base leading-8 text-[#d6c7b3] sm:text-lg">
                Built for people who need legal reading, drafting, and learning in one
                evidence-aware workspace powered by proprietary models.
              </p>

              <div className="mt-6 border border-[#d6a850]/25 bg-[#fff8eb]/8 p-4 text-sm text-[#e8dcc8] backdrop-blur md:hidden">
                <div className="flex items-center gap-3">
                  <Scale className="size-4 shrink-0 text-[#d6a850]" />
                  <span className="font-semibold text-[#fff8eb]">
                    Service agreement.pdf
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs">
                  <span className="text-[#9dc7f4]">Found: 30-day notice window</span>
                  <span className="text-[#a4eadf]">Next: draft reply before filing</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openAuthDialog("signup")}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#d6a850] px-6 text-base font-bold text-[#15110d] shadow-[0_18px_50px_rgba(214,168,80,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#efc878] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Start a matter
                  <ArrowRight className="size-5" />
                </button>
                <Link
                  to="/assistant"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/18 px-6 text-base font-semibold text-[#fff8eb] transition duration-200 hover:-translate-y-0.5 hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6a850]"
                >
                  View workspace
                  <ChevronRight className="size-5" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              style={shouldReduceMotion ? undefined : { y: heroSceneY }}
              className="pointer-events-auto hidden md:absolute md:inset-x-6 md:bottom-5 md:block md:h-[30rem] lg:relative lg:inset-auto lg:h-auto lg:min-h-[42rem]"
              aria-label="JusticePath matter workspace preview"
            >
              <div className="absolute left-0 top-4 w-[min(24rem,82vw)] border border-white/12 bg-[#1f1912]/82 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:p-5 lg:left-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-[#d6a850]">
                      Matter
                    </p>
                    <p className="mt-1 font-editor text-2xl text-white">
                      Lease termination
                    </p>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-full bg-[#65c7b8]/15 text-[#8ee6d8]">
                    <Scale className="size-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  {caseLines.map((line, index) => (
                    <div
                      key={line.label}
                      className={cn(
                        "grid grid-cols-[5.5rem_1fr] items-center border-t border-white/10 py-3 text-sm",
                        index > 1 && "hidden sm:grid"
                      )}
                    >
                      <span className="font-semibold text-[#9d8f7d]">{line.label}</span>
                      <span
                        className={cn(
                          "font-medium",
                          line.tone === "gold" && "text-[#f2cd81]",
                          line.tone === "blue" && "text-[#9dc7f4]",
                          line.tone === "red" && "text-[#f0a7a7]",
                          line.tone === "green" && "text-[#a4eadf]"
                        )}
                      >
                        {line.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-0 right-0 w-[min(33rem,92vw)] border border-[#d6a850]/24 bg-[#fff8eb]/94 p-3 text-[#15110d] shadow-[0_34px_100px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:p-4 lg:right-3">
                <PromptInput
                  value={heroPrompt}
                  onValueChange={setHeroPrompt}
                  onSubmit={handleDemoSubmit}
                  className="border-0 bg-transparent p-0 shadow-none"
                >
                  <PromptInputTextarea
                    aria-label="Ask JusticePath a legal question"
                    placeholder="Can my landlord terminate before the 30-day notice window?"
                    className="min-h-24 resize-none text-base leading-7 text-[#21180f] placeholder:text-[#7f715f]"
                  />
                  <PromptInputActions className="mt-3 justify-between border-t border-[#dccfb8] pt-3">
                    <div className="flex items-center gap-1">
                      <PromptInputAction tooltip="Upload file">
                        <span className="inline-flex size-10 items-center justify-center rounded-full text-[#574735] transition hover:bg-[#eadbc1] hover:text-[#15110d]">
                          <Paperclip className="size-4" />
                        </span>
                      </PromptInputAction>
                      <PromptInputAction tooltip="Voice input">
                        <span className="inline-flex size-10 items-center justify-center rounded-full text-[#574735] transition hover:bg-[#eadbc1] hover:text-[#15110d]">
                          <Mic className="size-4" />
                        </span>
                      </PromptInputAction>
                    </div>
                    <Button className="size-11 rounded-full bg-[#15110d] text-[#fff8eb] hover:bg-[#2d2217]">
                      <ArrowRight className="size-4" />
                    </Button>
                  </PromptInputActions>
                </PromptInput>

                {showLoginPrompt ? (
                  <div className="mt-3 border-t border-[#dccfb8] pt-3 text-sm font-medium text-[#574735]">
                    <TextEffect>
                      Create an account to open this prompt in a live matter workspace.
                    </TextEffect>
                  </div>
                ) : null}
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
