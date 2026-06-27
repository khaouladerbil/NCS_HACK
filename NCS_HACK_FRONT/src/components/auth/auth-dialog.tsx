"use client"

import { toast } from "@heroui/react"
import {
  ArrowRight,
  Check,
  Shield,
  UserRound,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useEffect, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import {
  Dialog,
  DialogClose,
  DialogContent,
} from "@/components/core/dialog"
import { cn } from "@/lib/utils"
import { login, register } from "@/lib/backend"
import logoMark from "../../../Logo.svg"

export type AuthMode = "signin" | "signup"
type OnboardingStep = 0 | 1 | 2

const ALGERIA_CITIES = ["Alger", "Oran", "Constantine", "Annaba", "Setif", "Blida"]
const ALGERIA_USE_CASES = [
  "Affaires familiales",
  "Litiges civils",
  "Contrats commerciaux",
  "Dossiers administratifs",
]
const LANGUAGES = ["Arabe", "Français", "Anglais"]

const ONBOARDING_STEPS = [
  { label: "Localisation", description: "Votre ville de résidence" },
  { label: "Besoin", description: "Votre domaine juridique" },
  { label: "Préférences", description: "Langue et espace de travail" },
]

type AuthDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: AuthMode
}

export function AuthDialog({
  open,
  onOpenChange,
  initialMode = "signup",
}: AuthDialogProps) {
  const navigate = useNavigate()
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
    if (!open) return
    setMode(initialMode)
    setStage("auth")
    setStep(0)
    setAuthError(null)
  }, [initialMode, open])

  function closeDialog() {
    onOpenChange(false)
  }

  function enterWorkspace() {
    localStorage.setItem(
      "justicepath-auth",
      JSON.stringify({ status: "logged-in", country: "Algeria", onboarding })
    )
    closeDialog()
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
        await login(authForm.email, authForm.password)
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
    if (isSignup) {
      setStage("onboarding")
      setStep(0)
      return
    }
    enterWorkspace()
  }

  function nextStep() {
    if (step < 2) {
      setStep((prev) => (prev + 1) as OnboardingStep)
      return
    }
    enterWorkspace()
  }

  function prevStep() {
    if (step === 0) {
      setStage("auth")
      return
    }
    setStep((prev) => (prev - 1) as OnboardingStep)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[96dvh] w-full max-w-[28rem] overflow-hidden border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <div className="relative flex max-h-[96dvh] flex-col overflow-hidden rounded-[2rem] border border-[#e8ddd1]/60 bg-[linear-gradient(160deg,#fffdf9_0%,#f7f0e4_100%)] shadow-[0_32px_100px_rgba(41,28,8,0.26),0_0_0_1px_rgba(255,255,255,0.6)_inset]">

          {/* Close button */}
          <DialogClose className="absolute right-4 top-4 z-10 size-8 rounded-full text-[#9c8a76] transition hover:bg-[#f0ebe4] hover:text-[#291c08]" />

          {/* Header */}
          <div className="shrink-0 px-7 pb-5 pt-7">
            <div className="flex items-center gap-2.5">
              <img src={logoMark} alt="JusticePath" className="h-8 w-auto" />
              <span className="font-[Georgia,Times_New_Roman,serif] text-[1.1rem] tracking-[-0.03em] text-[#291c08]">
                JusticePath
              </span>
            </div>

            <div className="mt-5">
              {stage === "auth" ? (
                <>
                  <h2 className="font-[Georgia,Times_New_Roman,serif] text-[1.65rem] leading-tight tracking-[-0.04em] text-[#1a0f04]">
                    {isSignup ? "Créer un compte" : "Bon retour"}
                  </h2>
                  <p className="mt-1.5 text-[0.82rem] text-[#8a7762]">
                    {isSignup
                      ? "Votre espace juridique privé vous attend."
                      : "Connectez-vous pour accéder à votre espace."}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-[Georgia,Times_New_Roman,serif] text-[1.65rem] leading-tight tracking-[-0.04em] text-[#1a0f04]">
                    {ONBOARDING_STEPS[step].label}
                  </h2>
                  <p className="mt-1.5 text-[0.82rem] text-[#8a7762]">
                    {ONBOARDING_STEPS[step].description}
                  </p>
                </>
              )}
            </div>

            {/* Mode tabs — only on auth stage */}
            {stage === "auth" && (
              <div className="mt-4 flex gap-1 rounded-full border border-[#e5dbd0] bg-white/70 p-1">
                {(["signin", "signup"] as const).map((m) => (
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
            )}

            {/* Progress — only on onboarding stage */}
            {stage === "onboarding" && (
              <div className="mt-4 flex gap-2">
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

          {/* Divider */}
          <div className="mx-7 h-px bg-[#e8ddd1]" />

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-7 pt-5">
            <AnimatePresence mode="wait" initial={false}>
              {stage === "auth" ? (
                <motion.div
                  key="auth"
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
                    className="flex h-11 w-full items-center justify-center gap-2.5 rounded-[1.1rem] border border-[#e5dbd0] bg-white text-[0.86rem] font-medium text-[#291c08] shadow-[0_2px_8px_rgba(41,28,8,0.06)] transition hover:bg-[#fcf8f2] hover:shadow-[0_4px_14px_rgba(41,28,8,0.1)]"
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
                    />
                  )}

                  <AuthField
                    label="Adresse e-mail"
                    type="email"
                    value={authForm.email}
                    onChange={(v) => setAuthForm((p) => ({ ...p, email: v }))}
                    placeholder="nom@exemple.com"
                    icon={<span className="text-[0.7rem] font-semibold">@</span>}
                  />

                  <AuthField
                    label="Mot de passe"
                    type="password"
                    value={authForm.password}
                    onChange={(v) => setAuthForm((p) => ({ ...p, password: v }))}
                    placeholder="••••••••"
                    icon={<Shield className="size-3.5" />}
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
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
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
                      cols={2}
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
                        <>Accéder à l'espace <Check className="size-4" /></>
                      ) : (
                        <>Suivant <ArrowRight className="size-4" /></>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AuthField({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  icon: ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.72rem] font-medium text-[#8a7762]">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b5a899]">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-[1rem] border border-[#e5dbd0] bg-white pl-9 pr-4 text-[0.86rem] text-[#291c08] outline-none transition placeholder:text-[#c9bfb5] focus:border-[#291c08]/40 focus:ring-2 focus:ring-[#291c08]/8"
        />
      </div>
    </div>
  )
}

function SelectGrid({
  options,
  value,
  onChange,
  cols = 2,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  cols?: 2 | 3
}) {
  return (
    <div className={cn("grid gap-2", cols === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-[1rem] border px-3 py-3 text-[0.82rem] font-medium transition-all",
            value === option
              ? "border-[#291c08] bg-[#291c08] text-white shadow-sm"
              : "border-[#e5dbd0] bg-white text-[#4b3825] hover:border-[#c4b49a] hover:bg-[#fcf8f2]"
          )}
        >
          {value === option && <Check className="mx-auto mb-1 size-3.5" />}
          {option}
        </button>
      ))}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
