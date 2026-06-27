import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { gsap } from "gsap"
import Lenis from "lenis"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import {
  ArrowRight,
  ChevronRight,
  FilePenLine,
  GraduationCap,
  Menu,
  MessageSquareText,
  X,
} from "lucide-react"

import { AuthDialog, type AuthMode } from "@/components/auth/auth-dialog"
import { ChatComposer } from "@/components/chat/chat-composer"
import { TextEffect } from "@/components/core/text-effect"
import logoMark from "../../Logo.svg"

const navItems = [
  { label: "Showcase", href: "#showcase" },
  { label: "Workflow", href: "#workflow" },
  { label: "Pricing", href: "#pricing" },
]

const workflowSteps = [
  ["01", "Upload", "PDF, DOCX, lease, brief, notice."],
  ["02", "Ask", "Clause, risk, deadline, draft path."],
  ["03", "Draft", "A4 editor, export, human handoff."],
]

const modeStories = [
  {
    mode: "Consultant",
    title: "Question in. Clause stays visible.",
    body: "Ask once. Get practical next actions with the source trail intact.",
    icon: MessageSquareText,
  },
  {
    mode: "Editor",
    title: "Draft on a page, not in a box.",
    body: "Move from answer to letter, petition, or contract revision without context loss.",
    icon: FilePenLine,
  },
  {
    mode: "Professor",
    title: "Learn the rule inside the matter.",
    body: "Turn facts into short checkpoints instead of abstract legal theory.",
    icon: GraduationCap,
  },
]

const showcaseRows = [
  ["Record", "algeria-lease.pdf"],
  ["Found", "30-day written notice"],
  ["Risk", "penalty clause needs counsel"],
  ["Draft", "reply letter ready"],
]

const pricingPlans = [
  {
    name: "Basic",
    price: "2,500 DA",
    line: "Per month for light case work.",
    items: ["2 cases", "Lawyer matches", "2 document exports"],
  },
  {
    name: "Pro",
    price: "Custom",
    line: "For heavier Algerian matter volume.",
    items: ["5 cases", "Lawyer matches", "10 document exports"],
  },
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
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = window.requestAnimationFrame(raf)
    }
    rafId = window.requestAnimationFrame(raf)

    const handlePointerDown = (event: Event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "button, a, [role='button']"
      )
      if (!target) return

      gsap.fromTo(
        target,
        { scale: 1 },
        {
          scale: 0.975,
          duration: 0.08,
          ease: "power2.out",
          overwrite: true,
          repeat: 1,
          yoyo: true,
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
    <div className="min-h-screen overflow-x-hidden bg-[#f5efe2] text-[#17120d] selection:bg-[#d6a850] selection:text-[#15110d]">
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

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#15110d]/72 text-[#fff8eb] backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3 text-[#fff8eb]">
            <img src={logoMark} alt="JusticePath" className="h-10 w-auto sm:h-11" />
            <span className="font-editor text-2xl leading-none sm:text-3xl">
              JusticePath
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#d8cbb7] md:flex">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="transition hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => openAuthDialog("signin")}
              className="min-h-11 rounded-full px-4 text-sm font-semibold text-[#f2e4cd] transition hover:text-white"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => openAuthDialog("signup")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#d6a850] px-5 text-sm font-bold text-[#15110d] transition hover:bg-[#efc878]"
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
                  className="rounded-full px-4 py-3 text-sm font-semibold text-[#e8dcc8]"
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
                className="rounded-full border border-white/12 px-4 py-3 text-left text-sm font-semibold text-[#fff8eb]"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  openAuthDialog("signup")
                }}
                className="rounded-full bg-[#d6a850] px-4 py-3 text-left text-sm font-bold text-[#15110d]"
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
          className="relative isolate min-h-[92dvh] overflow-hidden bg-[#f8f1e5] text-[#17120d]"
        >
          <div className="landing-hero-light absolute inset-0" />
          <motion.div
            aria-hidden="true"
            style={shouldReduceMotion ? undefined : { y: heroSceneY }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(214,168,80,0.12),transparent_18%),radial-gradient(circle_at_80%_65%,rgba(214,168,80,0.06),transparent_20%)]"
          />

          <motion.div
            aria-hidden="true"
            style={shouldReduceMotion ? undefined : { y: heroSignalY }}
            className="absolute inset-x-4 top-28 z-10 mx-auto hidden max-w-7xl justify-between text-xs font-semibold uppercase text-[#8b642b]/70 md:flex"
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
              <p className="mb-8 text-sm font-semibold uppercase text-[#8b642b]">
                Algerian legal AI workspace
              </p>
              <h1 className="font-editor text-7xl leading-[0.82] text-[#17120d] sm:text-8xl lg:text-[9.5rem]">
                <TextEffect per="char">JusticePath</TextEffect>
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-balance text-2xl leading-tight text-[#2a2117] sm:text-4xl">
                Ask the legal question. Keep the clause, draft, and next step in one place.
              </p>
              <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#5a4b3a] sm:text-lg">
                Minimal surface. Built for Algerian matters. Powered by proprietary models.
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
                className="rounded-[2rem] border border-[#dfd3bf] bg-[#fffdf8]/96 p-3 shadow-[0_20px_50px_rgba(35,23,10,0.08)] backdrop-blur"
                textareaClassName="min-h-16 text-sm leading-6 text-[#24180d] placeholder:text-[#7e715e]"
              />

              {showLoginPrompt ? (
                <p className="mt-4 text-sm font-medium text-[#675949]">
                  Create a workspace to continue with this matter.
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold text-[#5a4b3a]">
                <button
                  type="button"
                  onClick={() => openAuthDialog("signup")}
                  className="inline-flex items-center gap-2 text-[#8b642b] transition hover:text-[#17120d]"
                >
                  Start a matter
                  <ArrowRight className="size-4" />
                </button>
                <Link
                  to="/assistant"
                  className="inline-flex items-center gap-2 transition hover:text-[#17120d]"
                >
                  View workspace
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section
          id="showcase"
          className="relative overflow-hidden border-y border-[#ddcfb7] bg-[#f5efe2] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <Reveal>
              <p className="text-sm font-bold uppercase text-[#8b642b]">Showcase</p>
              <h2 className="mt-4 max-w-xl font-editor text-5xl leading-[0.95] text-[#17120d] sm:text-6xl">
                One matter. Three surfaces.
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-[#5a4b3a]">
                Consultant, editor, and professor stay attached to the same file.
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <motion.div
                whileHover={{ rotateX: 1.5, rotateY: -2, y: -4 }}
                transition={{ type: "spring", stiffness: 160, damping: 18 }}
                className="relative min-h-[34rem] overflow-hidden rounded-[2rem] border border-[#d8c8ab] bg-[#17120d] p-5 text-[#fff8eb] shadow-[0_34px_90px_rgba(36,21,6,0.22)] sm:p-8"
              >
                <div className="absolute inset-0 landing-crosshatch opacity-10" />
                <div className="relative grid h-full gap-8 lg:grid-cols-[0.88fr_1.12fr]">
                  <div className="flex flex-col justify-between gap-8">
                    <div>
                      <p className="text-xs font-bold uppercase text-[#d6a850]">
                        Consultant
                      </p>
                      <div className="mt-6 space-y-5">
                        {showcaseRows.map(([label, value], index) => (
                          <motion.div
                            key={label}
                            initial={shouldReduceMotion ? false : { opacity: 0, x: -18 }}
                            whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.07 }}
                            className="border-b border-white/10 pb-4"
                          >
                            <p className="text-xs font-semibold text-[#8a7d6b]">
                              {label}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-[#f6ead6]">
                              {value}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <p className="max-w-sm text-sm leading-6 text-[#c9baa4]">
                      Source trail visible before draft work starts.
                    </p>
                  </div>

                  <div className="relative min-h-[27rem] bg-[#f8f1e5] p-8 text-[#24180d] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
                    <div className="font-editor text-3xl leading-tight">
                      Reply to Notice
                    </div>
                    <div className="mt-8 space-y-3 text-sm leading-7 text-[#4f412f]">
                      <p>Dear Counsel,</p>
                      <p>
                        We acknowledge receipt of the termination notice. The agreement
                        requires thirty days written notice before termination.
                      </p>
                      <p className="border-l-2 border-[#d6a850] pl-4 text-[#2b2117]">
                        Suggested edit: cite Section 8 before discussing penalty exposure.
                      </p>
                    </div>
                    <motion.div
                      aria-hidden="true"
                      className="absolute bottom-6 right-6 h-16 w-16 rounded-full border border-[#d6a850]"
                      animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>
              </motion.div>
            </Reveal>
          </div>
        </section>

        <section
          id="workflow"
          className="bg-[#17120d] px-4 py-20 text-[#fff8eb] sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal className="lg:sticky lg:top-28 lg:h-fit">
              <p className="text-sm font-bold uppercase text-[#d6a850]">Workflow</p>
              <h2 className="mt-4 max-w-xl font-editor text-5xl leading-[0.95] text-white sm:text-6xl">
                Three modes. One evidence trail.
              </h2>
              <div className="mt-10 grid gap-6">
                {workflowSteps.map(([step, title, body]) => (
                  <div key={step} className="border-t border-white/10 pt-4">
                    <p className="text-xs font-bold text-[#d6a850]">{step}</p>
                    <p className="mt-2 text-xl font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#c9baa4]">{body}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <div className="space-y-1 border-y border-white/10">
              {modeStories.map((item, index) => {
                const Icon = item.icon

                return (
                  <Reveal key={item.mode} delay={index * 0.08}>
                    <article className="group border-b border-white/10 py-8 transition duration-300 hover:px-3">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#d6a850]/10 text-[#f2cd81] transition group-hover:rotate-6 group-hover:bg-[#d6a850]/20">
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
          id="pricing"
          className="relative overflow-hidden bg-[#fffaf0] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <motion.div
            aria-hidden="true"
            className="absolute left-1/2 top-10 h-44 w-44 -translate-x-1/2 rounded-full border border-[#d6a850]/30"
            animate={
              shouldReduceMotion
                ? undefined
                : { scale: [1, 1.08, 1], opacity: [0.35, 0.75, 0.35] }
            }
            transition={{ duration: 4, repeat: Infinity }}
          />
          <div className="relative mx-auto max-w-7xl">
            <Reveal>
              <p className="text-sm font-bold uppercase text-[#8b642b]">Pricing</p>
              <h2 className="mt-4 max-w-3xl font-editor text-5xl leading-[0.95] text-[#17120d] sm:text-6xl">
                Start small. Scale when legal work gets serious.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5a4b3a]">
                Algerian pricing for real document-heavy case work.
              </p>
            </Reveal>

            <div className="mt-14 grid border-y border-[#d8c8ab] lg:grid-cols-2">
              {pricingPlans.map((plan, index) => (
                <Reveal key={plan.name} delay={index * 0.08}>
                  <motion.article
                    whileHover={{ y: -8 }}
                    className="h-full rounded-[1.75rem] border-b border-[#d8c8ab] px-6 py-8 lg:border-b-0 lg:border-r lg:px-8 last:lg:border-r-0"
                  >
                    <p className="text-sm font-bold uppercase text-[#8b642b]">
                      {plan.name}
                    </p>
                    <p className="mt-8 font-editor text-6xl text-[#17120d]">
                      <TextEffect per="char">{plan.price}</TextEffect>
                    </p>
                    <p className="mt-4 text-base font-semibold text-[#4f412f]">
                      {plan.line}
                    </p>
                    <div className="mt-8 space-y-3 text-sm leading-6 text-[#5a4b3a]">
                      {plan.items.map((item) => (
                        <p key={item}>/ {item}</p>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => openAuthDialog("signup")}
                      className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#17120d] transition hover:text-[#8b642b]"
                    >
                      Choose
                      <ArrowRight className="size-4" />
                    </button>
                  </motion.article>
                </Reveal>
              ))}
            </div>
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
            Algerian legal assistance powered by proprietary models. Human review still matters.
          </p>

          <div className="flex flex-wrap items-center gap-5 text-sm font-semibold text-[#3b2e20]">
            <a href="#pricing" className="transition-colors hover:text-[#17120d]">
              Pricing
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
