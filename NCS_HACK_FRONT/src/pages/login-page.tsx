"use client"

import { toast } from "@heroui/react"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  UserRound,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useEffect, useState, type ReactNode } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import logoMark from "../../Logo.svg"

type AuthMode = "signin" | "signup"
type OnboardingStep = 0 | 1 | 2

const ALGERIA_CITIES = ["Alger", "Oran", "Constantine", "Annaba", "Sétif", "Blida"]
const ALGERIA_USE_CASES = [
  "Affaires familiales",
  "Litiges civils",
  "Contrats commerciaux",
  "Dossiers administratifs",
]
const LANGUAGES = ["Arabe", "Français", "Anglais"]

const ONBOARDING_STEPS = [
  { label: "Localisation", description: "Votre ville de résidence" },
  { label: "Besoin",       description: "Votre domaine juridique principal" },
  { label: "Préférences", description: "Langue et espace de travail" },
]

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, register } = useAuth()

  const initialMode: AuthMode =
    searchParams.get("mode") === "signin" ? "signin" : "signup"

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [stage, setStage] = useState<"auth" | "onboarding">("auth")
  const [step, setStep] = useState<OnboardingStep>(0)
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" })
  const [onboarding, setOnboarding] = useState({
    city: "Alger",
    useCase: "Affaires familiales",
    language: "Français",
    workspaceName: "Dossier principal",
  })
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const isSignup = mode === "signup"

  useEffect(() => {
    setAuthError(null)
  }, [mode])

  function enterWorkspace() {
    localStorage.setItem(
      "justicepath-auth",
      JSON.stringify({ status: "logged-in", country: "Algeria", onboarding })
    )
    navigate("/assistant")
  }

  async function finishAuth() {
    if (!authForm.email.trim() || !authForm.password.trim()) {
      toast("Email et mot de passe requis")
      return
    }
    if (isSignup && !authForm.name.trim()) {
      toast("Nom requis")
      return
    }
    setAuthLoading(true)
    setAuthError(null)
    try {
      if (isSignup) {
        await register(authForm.name, authForm.email, authForm.password)
        setStage("onboarding")
        setStep(0)
      } else {
        await login(authForm.email, authForm.password)
        enterWorkspace()
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Erreur de connexion")
    } finally {
      setAuthLoading(false)
    }
  }

  function continueWithGoogle() {
    if (isSignup) { setStage("onboarding"); setStep(0); return }
    enterWorkspace()
  }

  function nextStep() {
    if (step < 2) { setStep((p) => (p + 1) as OnboardingStep); return }
    enterWorkspace()
  }

  function prevStep() {
    if (step === 0) { setStage("auth"); return }
    setStep((p) => (p - 1) as OnboardingStep)
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#fcf9f1_0%,#f3ece0_100%)]">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 size-[36rem] rounded-full bg-[#d6ab66]/10 blur-[80px]" />
        <div className="absolute -bottom-32 right-0 size-[28rem] rounded-full bg-[#c49a4a]/8 blur-[72px]" />
      </div>

      {/* Top nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-2 text-[#6b5c4d] transition hover:text-[#291c08]">
          <ArrowLeft className="size-4" />
          <span className="text-[0.8rem] font-medium">Retour</span>
        </Link>
        <div className="flex items-center gap-2">
          <img src={logoMark} alt="JusticePath" className="h-8 w-auto" />
          <span className="font-[Georgia,Times_New_Roman,serif] text-[1.1rem] tracking-[-0.03em] text-[#291c08]">
            JusticePath
          </span>
        </div>
        <div className="w-16" />
      </header>

      {/* Center card */}
      <div className="relative z-10 flex min-h-[calc(100dvh-4.5rem)] items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-[26rem]"
        >
          <div className="overflow-hidden rounded-[2rem] border border-[#e8ddd1]/70 bg-[linear-gradient(160deg,#fffdf9_0%,#f7f0e4_100%)] shadow-[0_40px_120px_rgba(41,28,8,0.22),0_0_0_1px_rgba(255,255,255,0.7)_inset]">

            {/* Header */}
            <div className="px-7 pb-5 pt-7">
              <AnimatePresence mode="wait" initial={false}>
                {stage === "auth" ? (
                  <motion.div
                    key="header-auth"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    <h1 className="font-[Georgia,Times_New_Roman,serif] text-[1.7rem] leading-tight tracking-[-0.04em] text-[#1a0f04]">
                      {isSignup ? "Créer un compte" : "Bon retour"}
                    </h1>
                    <p className="mt-1.5 text-[0.82rem] text-[#8a7762]">
                      {isSignup
                        ? "Votre espace juridique privé vous attend."
                        : "Connectez-vous pour accéder à votre espace."}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`header-onboarding-${step}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#b5a899]">
                      Étape {step + 1} / 3
                    </p>
                    <h1 className="mt-1 font-[Georgia,Times_New_Roman,serif] text-[1.7rem] leading-tight tracking-[-0.04em] text-[#1a0f04]">
                      {ONBOARDING_STEPS[step].label}
                    </h1>
                    <p className="mt-1 text-[0.82rem] text-[#8a7762]">
                      {ONBOARDING_STEPS[step].description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabs / progress */}
              <div className="mt-4">
                {stage === "auth" ? (
                  <div className="flex gap-1 rounded-full border border-[#e5dbd0] bg-white/70 p-1">
                    {(["signup", "signin"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setMode(m); setAuthError(null) }}
                        className={cn(
                          "flex-1 rounded-full py-2 text-[0.8rem] font-medium transition-all",
                          mode === m
                            ? "bg-[#291c08] text-white shadow-sm"
                            : "text-[#8a7762] hover:text-[#291c08]"
                        )}
                      >
                        {m === "signin" ? "Connexion" : "Inscription"}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          i <= step ? "bg-[#291c08]" : "bg-[#e5dbd0]"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-7 h-px bg-[#e8ddd1]" />

            {/* Body */}
            <div className="px-7 pb-7 pt-5">
              <AnimatePresence mode="wait" initial={false}>
                {stage === "auth" ? (
                  <motion.div
                    key="auth-body"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                  >
                    {/* Google */}
                    <button
                      type="button"
                      onClick={continueWithGoogle}
                      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-[1.1rem] border border-[#e5dbd0] bg-white text-[0.86rem] font-medium text-[#291c08] shadow-[0_2px_8px_rgba(41,28,8,0.06)] transition hover:bg-[#fcf8f2]"
                    >
                      <GoogleIcon />
                      {isSignup ? "Continuer avec Google" : "Connexion avec Google"}
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-[#e8ddd1]" />
                      <span className="text-[0.72rem] text-[#b5a899]">ou</span>
                      <div className="h-px flex-1 bg-[#e8ddd1]" />
                    </div>

                    {isSignup && (
                      <AuthField
                        label="Nom complet"
                        type="text"
                        value={authForm.name}
                        onChange={(v) => setAuthForm((p) => ({ ...p, name: v }))}
                        placeholder="Votre nom"
                        icon={<UserRound className="size-3.5" />}
                        onEnter={() => void finishAuth()}
                      />
                    )}

                    <AuthField
                      label="Adresse e-mail"
                      type="email"
                      value={authForm.email}
                      onChange={(v) => setAuthForm((p) => ({ ...p, email: v }))}
                      placeholder="nom@exemple.com"
                      icon={<span className="text-[0.7rem] font-bold">@</span>}
                      onEnter={() => void finishAuth()}
                    />

                    <AuthField
                      label="Mot de passe"
                      type="password"
                      value={authForm.password}
                      onChange={(v) => setAuthForm((p) => ({ ...p, password: v }))}
                      placeholder="••••••••"
                      icon={<Shield className="size-3.5" />}
                      onEnter={() => void finishAuth()}
                    />

                    {authError && (
                      <div className="rounded-xl border border-[#ead0cb] bg-[#fbefed] px-4 py-3 text-[0.8rem] text-[#9f2d20]">
                        {authError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => void finishAuth()}
                      disabled={authLoading}
                      className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-[1.1rem] bg-[#291c08] text-[0.86rem] font-semibold text-white shadow-[0_8px_24px_rgba(41,28,8,0.22)] transition hover:bg-[#1d1406] disabled:opacity-60"
                    >
                      {authLoading ? (
                        <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          {isSignup ? "Créer mon compte" : "Se connecter"}
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`onboarding-${step}`}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3"
                  >
                    {step === 0 && (
                      <SelectGrid
                        options={ALGERIA_CITIES}
                        value={onboarding.city}
                        onChange={(v) => setOnboarding((p) => ({ ...p, city: v }))}
                        cols={2}
                      />
                    )}

                    {step === 1 && (
                      <SelectGrid
                        options={ALGERIA_USE_CASES}
                        value={onboarding.useCase}
                        onChange={(v) => setOnboarding((p) => ({ ...p, useCase: v }))}
                        cols={1}
                      />
                    )}

                    {step === 2 && (
                      <>
                        <SelectGrid
                          options={LANGUAGES}
                          value={onboarding.language}
                          onChange={(v) => setOnboarding((p) => ({ ...p, language: v }))}
                          cols={3}
                        />
                        <AuthField
                          label="Nom de l'espace de travail"
                          type="text"
                          value={onboarding.workspaceName}
                          onChange={(v) => setOnboarding((p) => ({ ...p, workspaceName: v }))}
                          placeholder="Dossier principal"
                          icon={<UserRound className="size-3.5" />}
                          onEnter={nextStep}
                        />
                      </>
                    )}

                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex h-11 flex-1 items-center justify-center rounded-[1.1rem] border border-[#e5dbd0] bg-white text-[0.86rem] font-medium text-[#4b3825] transition hover:bg-[#fcf8f2]"
                      >
                        Retour
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-[1.1rem] bg-[#291c08] text-[0.86rem] font-semibold text-white shadow-[0_8px_24px_rgba(41,28,8,0.22)] transition hover:bg-[#1d1406]"
                      >
                        {step === 2 ? (
                          <><span>Accéder à l'espace</span><Check className="size-4" /></>
                        ) : (
                          <><span>Suivant</span><ArrowRight className="size-4" /></>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer hint */}
          <p className="mt-4 text-center text-[0.75rem] text-[#b5a899]">
            {isSignup && stage === "auth" ? (
              <>Déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setAuthError(null) }}
                  className="font-medium text-[#6b5c4d] underline-offset-2 hover:underline"
                >
                  Se connecter
                </button>
              </>
            ) : stage === "auth" ? (
              <>Pas encore de compte ?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setAuthError(null) }}
                  className="font-medium text-[#6b5c4d] underline-offset-2 hover:underline"
                >
                  Créer un compte
                </button>
              </>
            ) : (
              "Vos données restent privées et sécurisées."
            )}
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function AuthField({
  label, type, value, onChange, placeholder, icon, onEnter,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  icon: ReactNode
  onEnter?: () => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.72rem] font-medium text-[#8a7762]">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b5a899]">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter() }}
          placeholder={placeholder}
          className="h-11 w-full rounded-[1rem] border border-[#e5dbd0] bg-white pl-9 pr-4 text-[0.86rem] text-[#291c08] outline-none transition placeholder:text-[#c9bfb5] focus:border-[#291c08]/40 focus:ring-2 focus:ring-[#291c08]/8"
        />
      </div>
    </div>
  )
}

function SelectGrid({
  options, value, onChange, cols = 2,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  cols?: 1 | 2 | 3
}) {
  const grid = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" }
  return (
    <div className={cn("grid gap-2", grid[cols])}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "flex items-center gap-2 rounded-[1rem] border px-3 py-3 text-[0.82rem] font-medium transition-all",
            value === option
              ? "border-[#291c08] bg-[#291c08] text-white shadow-sm"
              : "border-[#e5dbd0] bg-white text-[#4b3825] hover:border-[#c4b49a] hover:bg-[#fcf8f2]"
          )}
        >
          {value === option && <Check className="size-3.5 shrink-0" />}
          {option}
        </button>
      ))}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.348 17.64 12.04 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
