import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  FilePenLine,
  GraduationCap,
  Menu,
  MessageSquareText,
  Scale,
  ArrowUp,
  Mic,
  Paperclip,
  X,
} from "lucide-react"

import { TextEffect } from "@/components/core/text-effect"
import { Button } from "@/components/ui/button"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import logoMark from "../../Logo.svg"

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Mission", href: "#mission" },
]

const modeCards = [
  {
    title: "Consultant",
    description:
      "Ask about notice periods, filing paths, and document risks in plain language while sources stay close at hand.",
    icon: MessageSquareText,
  },
  {
    title: "Editor",
    description:
      "Draft petitions, contracts, and letters inside an A4-style workspace built for legal writing and review.",
    icon: FilePenLine,
  },
  {
    title: "Professor",
    description:
      "Build legal fluency through guided lessons, checkpoints, and explainers that turn doctrine into practice.",
    icon: GraduationCap,
  },
]

const trustPoints = [
  "Notice periods surfaced from uploaded files",
  "Workspace built for contracts, letters, and petitions",
  "Inline guidance without losing document context",
]

const floatingPhrases = [
  {
    text: "notice period",
    className:
      "left-[6%] top-[18%] md:left-[10%] md:top-[20%] [animation-delay:-0.7s]",
  },
  {
    text: "termination clause",
    className:
      "right-[8%] top-[16%] md:right-[12%] md:top-[18%] [animation-delay:-2.4s]",
  },
  {
    text: "draft petition",
    className:
      "left-[12%] bottom-[24%] md:left-[16%] md:bottom-[24%] [animation-delay:-1.5s]",
  },
  {
    text: "civil procedure",
    className:
      "right-[10%] bottom-[22%] md:right-[14%] md:bottom-[22%] [animation-delay:-3.1s]",
  },
  {
    text: "statutory reference",
    className:
      "left-[26%] top-[9%] hidden lg:block [animation-delay:-0.3s]",
  },
  {
    text: "review contract",
    className:
      "right-[24%] bottom-[10%] hidden lg:block [animation-delay:-2.8s]",
  },
]

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [heroPrompt, setHeroPrompt] = useState("")

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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fcf9f1_0%,#fcf9f1_52%,#fffdf8_100%)] text-[#4E453D]">
      <header className="sticky top-0 z-50 border-b border-[#E9E2D4]/90 bg-[#FCF9F1]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-[#1F1407]">
            <img
              src={logoMark}
              alt="JusticePath"
              className="h-11 w-auto sm:h-12"
            />
            <span className="font-[Georgia,Times_New_Roman,serif] text-3xl tracking-[-0.04em] sm:text-[2.45rem]">
              JusticePath
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="transition-colors hover:text-[#1F1407]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/assistant"
              className="rounded-full px-4 py-2 text-sm font-medium text-[#4E453D] transition-colors hover:text-[#1F1407]"
            >
              Sign In
            </Link>
            <Link
              to="/assistant"
              className="inline-flex items-center gap-2 rounded-full bg-[#35230F] px-5 py-3 text-sm font-semibold text-[#FBF8F0] transition-colors hover:bg-[#241506]"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-[#DED2C0] bg-white/70 text-[#35230F] md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-[#E9E2D4] bg-[#FCF9F1] px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-[#4E453D] transition-colors hover:bg-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/assistant"
                className="rounded-2xl border border-[#D8CFC0] bg-white px-4 py-3 text-sm font-medium text-[#35230F]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/assistant"
                className="rounded-2xl bg-[#35230F] px-4 py-3 text-sm font-semibold text-[#FBF8F0]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get started
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-28">
          <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(214,171,102,0.18),transparent_68%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E3D5C1] bg-white/80 px-4 py-2 text-sm text-[#6C5A45] shadow-[0_12px_30px_rgba(63,39,10,0.05)]">
                <Scale className="size-4 text-[#A67834]" />
                Legal assistance guided by proprietary models
              </div>
              <h1 className="mt-6 font-[Georgia,Times_New_Roman,serif] text-5xl leading-[0.95] tracking-[-0.05em] text-[#221507] sm:text-6xl lg:text-7xl">
                Review, draft, and learn law in one calm workspace.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#5F5143] sm:text-xl">
                JusticePath turns uploaded legal documents into usable answers,
                writable drafts, and teachable next steps without drowning the
                screen in chrome.
              </p>
            </div>

            <div className="relative mx-auto mt-14 flex min-h-[28rem] w-full max-w-5xl items-center justify-center">
              <div className="absolute -left-4 top-10 hidden h-32 w-32 rounded-full bg-[#EBC98F]/30 blur-3xl sm:block" />
              <div className="absolute -right-4 bottom-8 hidden h-36 w-36 rounded-full bg-[#E4D2B2]/35 blur-3xl sm:block" />

              {floatingPhrases.map((item) => (
                <div
                  key={item.text}
                  className={`animate-hero-float absolute rounded-full border border-[#E7D8C2] bg-white/72 px-4 py-2 text-sm font-medium text-[#6C5A45] shadow-[0_14px_34px_rgba(48,30,10,0.06)] backdrop-blur-sm ${item.className}`}
                >
                  <TextEffect per="char" className="tracking-[0.02em]">
                    {item.text}
                  </TextEffect>
                </div>
              ))}

              <div className="relative z-10 w-full max-w-2xl">
                <PromptInput
                  value={heroPrompt}
                  onValueChange={setHeroPrompt}
                  onSubmit={() => undefined}
                  className="rounded-[2rem] border-[#D8CFC0] bg-white/94 p-4 shadow-[0_30px_80px_rgba(36,21,6,0.12)] backdrop-blur-xl sm:p-5"
                >
                  <PromptInputTextarea
                    placeholder="Ask about clause, deadline, filing path, or draft."
                    className="min-h-24 text-base leading-7 text-[#35230F] placeholder:text-[#8A7762]"
                  />
                  <PromptInputActions className="mt-4 justify-between">
                    <div className="flex items-center gap-1">
                      <PromptInputAction tooltip="Upload file">
                        <span className="inline-flex size-10 items-center justify-center rounded-full text-[#756553] transition hover:bg-[#F7F1E6] hover:text-[#2A1A0A]">
                          <Paperclip className="size-4" />
                        </span>
                      </PromptInputAction>
                      <PromptInputAction tooltip="Voice input">
                        <span className="inline-flex size-10 items-center justify-center rounded-full text-[#756553] transition hover:bg-[#F7F1E6] hover:text-[#2A1A0A]">
                          <Mic className="size-4" />
                        </span>
                      </PromptInputAction>
                    </div>
                    <Button className="size-10 rounded-full bg-[#35230F] hover:bg-[#241506]">
                      <ArrowUp className="size-4" />
                    </Button>
                  </PromptInputActions>
                </PromptInput>
              </div>
            </div>

            <div className="mx-auto mt-10 flex max-w-4xl flex-col items-center gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  to="/assistant"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#35230F] px-6 py-3.5 text-base font-semibold text-[#FBF8F0] shadow-[0_16px_40px_rgba(53,35,15,0.18)] transition-transform hover:-translate-y-0.5 hover:bg-[#241506]"
                >
                  Open workspace
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8CFC0] bg-white/75 px-6 py-3.5 text-base font-medium text-[#35230F] transition-colors hover:bg-white"
                >
                  Explore modes
                </a>
              </div>

              <ul className="mt-2 grid w-full gap-3 text-sm text-[#5B4D3F] sm:grid-cols-2 lg:grid-cols-3">
                {trustPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 rounded-2xl border border-[#ECE2D4] bg-white/65 px-4 py-3"
                  >
                    <span className="mt-1 size-2 rounded-full bg-[#D6AB66]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-y border-[#E9E2D4] bg-white px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9A7440]">
                Three modes
              </p>
              <h2 className="mt-4 font-[Georgia,Times_New_Roman,serif] text-4xl tracking-[-0.04em] text-[#241506] sm:text-5xl">
                Three ways through legal work.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#5F5143]">
                Switch from guidance to drafting to learning without leaving the
                same evidence trail behind.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {modeCards.map((card) => {
                const Icon = card.icon

                return (
                  <article
                    key={card.title}
                    className="group rounded-[2rem] border border-[#E9E2D4] bg-[#FCF9F1] p-8 shadow-[0_16px_40px_rgba(36,21,6,0.04)] transition-transform duration-200 hover:-translate-y-1"
                  >
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#F7EEDC] text-[#35230F]">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-8 text-xl font-semibold text-[#241506]">
                      {card.title}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-[#5F5143]">
                      {card.description}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9A7440]">
                How it works
              </p>
              <h2 className="mt-4 font-[Georgia,Times_New_Roman,serif] text-4xl tracking-[-0.04em] text-[#241506] sm:text-5xl">
                Bring document. Get path.
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-8 text-[#5F5143]">
                Upload a document, ask a focused question, then move straight
                into draft edits or guided learning without restarting context.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                {
                  step: "01",
                  title: "Upload matter files",
                  body: "PDF and DOCX materials enter the workspace so answers can stay tied to the actual record.",
                },
                {
                  step: "02",
                  title: "Interrogate the clause",
                  body: "Consultant mode surfaces obligations, timing, and practical next questions in terse legal-review language.",
                },
                {
                  step: "03",
                  title: "Convert into draft work",
                  body: "Editor mode keeps the evidence close while you shape a letter, filing, or contract revision.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-[1.75rem] border border-[#E9E2D4] bg-white px-5 py-5 shadow-[0_14px_36px_rgba(36,21,6,0.04)] sm:px-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.22em] text-[#A67834]">
                        {item.step}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[#241506]">
                        {item.title}
                      </h3>
                      <p className="mt-3 max-w-xl text-base leading-7 text-[#5F5143]">
                        {item.body}
                      </p>
                    </div>
                    <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F7F1E6] text-[#35230F]">
                      <ArrowRight className="size-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="border-y border-[#E9E2D4] bg-[#F9F4EA] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#E8DCC8] bg-white/70 p-8 shadow-[0_18px_50px_rgba(48,30,10,0.06)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9A7440]">
                  Pricing
                </p>
                <h2 className="mt-4 font-[Georgia,Times_New_Roman,serif] text-4xl tracking-[-0.04em] text-[#241506] sm:text-5xl">
                  Start inside the workspace.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[#5F5143]">
                  JusticePath is still tightening the product around real legal
                  workflows. For now, the landing page leads straight into the
                  live product experience.
                </p>
              </div>

              <Link
                to="/assistant"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#35230F] px-6 py-3.5 text-base font-semibold text-[#FBF8F0] transition-colors hover:bg-[#241506]"
              >
                Launch app
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section
          id="mission"
          className="px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl rounded-[2.25rem] border border-[#E9E2D4] bg-[#23170A] px-6 py-10 text-[#F6ECDD] shadow-[0_24px_60px_rgba(36,21,6,0.18)] sm:px-10 sm:py-14">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#D6AB66]">
                  Mission
                </p>
                <h2 className="mt-4 max-w-3xl font-[Georgia,Times_New_Roman,serif] text-4xl tracking-[-0.04em] sm:text-5xl">
                  Make legal reading less opaque, drafting less brittle, learning less abstract.
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[#E7D9C4]">
                  JusticePath is being shaped as a legal assistance product that
                  moves between explanation, document work, and education with a
                  single visual language.
                </p>
              </div>

              <Link
                to="/assistant"
                className="inline-flex items-center gap-2 self-start rounded-full border border-[#8D6A38] px-5 py-3 text-sm font-semibold text-[#FBF8F0] transition-colors hover:bg-white/8"
              >
                Enter workspace
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E9E2D4] bg-[#FCF9F1] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-[#1F1407]">
            <img src={logoMark} alt="" className="h-10 w-auto" />
            <span className="font-[Georgia,Times_New_Roman,serif] text-3xl tracking-[-0.04em]">
              JusticePath
            </span>
          </div>

          <p className="text-sm text-[#6C5A45]">
            Copyright 2026 JusticePath. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-5 text-sm text-[#5F5143]">
            <a href="#mission" className="transition-colors hover:text-[#1F1407]">
              Mission
            </a>
            <Link to="/settings" className="transition-colors hover:text-[#1F1407]">
              Settings
            </Link>
            <Link
              to="/assistant"
              className="inline-flex items-center gap-1 font-medium text-[#35230F]"
            >
              Open app
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
