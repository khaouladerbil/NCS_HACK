import { toast } from "@heroui/react"
import {
  ArrowRight,
  Check,
  Globe,
  Mail,
  MapPinned,
  Shield,
  UserRound,
} from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/core/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AuthMode = "signin" | "signup"

type OnboardingStep = 0 | 1 | 2

const AUTH_MODES: { id: AuthMode; label: string }[] = [
  { id: "signin", label: "Sign in" },
  { id: "signup", label: "Sign up" },
]

const ALGERIA_CITIES = ["Alger", "Oran", "Constantine", "Annaba", "Setif", "Blida"]
const ALGERIA_USE_CASES = [
  "Family matters",
  "Civil disputes",
  "Commercial contracts",
  "Administrative files",
]
const LANGUAGES = ["Arabic", "French", "English"]

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
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [onboarding, setOnboarding] = useState({
    city: "Alger",
    useCase: "Family matters",
    language: "Arabic",
    workspaceName: "Dossier principal",
  })

  const isSignup = mode === "signup"

  useEffect(() => {
    if (!open) return
    setMode(initialMode)
    setStage("auth")
    setStep(0)
  }, [initialMode, open])

  function closeDialog() {
    onOpenChange(false)
  }

  function enterWorkspace() {
    localStorage.setItem(
      "justicepath-auth",
      JSON.stringify({
        status: "logged-in",
        country: "Algeria",
        onboarding,
      })
    )
    closeDialog()
    navigate("/assistant")
  }

  function finishAuth() {
    if (!authForm.email.trim() || !authForm.password.trim()) {
      toast("Email and password required")
      return
    }

    if (isSignup && !authForm.name.trim()) {
      toast("Name required")
      return
    }

    if (isSignup) {
      setStage("onboarding")
      setStep(0)
      return
    }

    enterWorkspace()
  }

  function continueWithGoogle() {
    if (isSignup) {
      setStage("onboarding")
      setStep(0)
      toast("Google sign-up selected")
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
      <DialogContent className="max-h-[min(92vh,46rem)] max-w-[30rem] overflow-hidden border border-[#ded6ca] bg-[#fbf8f1] p-0 shadow-[0_24px_80px_rgba(21,17,13,0.16)]">
        <div className="max-h-[min(92vh,48rem)] overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-[#ded6ca] bg-[#fbf8f1]/96 px-5 pb-4 pt-5 backdrop-blur">
            <DialogHeader className="pr-10">
              <DialogTitle className="font-editor text-2xl text-[#17120d]">
                Enter JusticePath
              </DialogTitle>
              <DialogDescription className="text-sm text-[#675949]">
                Private workspace. Fast start.
              </DialogDescription>
            </DialogHeader>

            <div className="relative mt-5 grid grid-cols-2 border border-[#ded6ca] bg-white p-1">
              <motion.div
                aria-hidden="true"
                className="absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] bg-[#17120d]"
                animate={{ x: mode === "signin" ? 0 : "100%" }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
              />
                {AUTH_MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMode(item.id)
                      setStage("auth")
                      setStep(0)
                    }}
                    className={cn(
                      "relative z-10 inline-flex h-9 items-center justify-center px-4 text-sm font-medium text-[#675949] transition-colors",
                      mode === item.id && "text-white"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
            </div>
          </div>

          <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
            {stage === "auth" ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={continueWithGoogle}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 border border-[#ded6ca] bg-white text-sm font-medium text-[#17120d] transition hover:bg-[#f4efe5]"
                >
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#17120d] text-[0.7rem] font-semibold text-white">
                    G
                  </span>
                  {isSignup ? "Continue with Google" : "Sign in with Google"}
                </button>

                {isSignup ? (
                  <Field
                    label="Name"
                    icon={UserRound}
                    value={authForm.name}
                    onChange={(value) => setAuthForm((prev) => ({ ...prev, name: value }))}
                    placeholder="Full name"
                  />
                ) : null}

                <Field
                  label="Email"
                  icon={Mail}
                  value={authForm.email}
                  onChange={(value) => setAuthForm((prev) => ({ ...prev, email: value }))}
                  placeholder="name@example.com"
                />

                <Field
                  label="Password"
                  icon={Shield}
                  type="password"
                  value={authForm.password}
                  onChange={(value) => setAuthForm((prev) => ({ ...prev, password: value }))}
                  placeholder="........"
                />

                <Button
                  onClick={finishAuth}
                  className="h-11 w-full rounded-none bg-[#17120d] text-sm text-white hover:bg-[#2a2117]"
                >
                  {isSignup ? "Continue" : "Sign in"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className={cn(
                        "border p-3 text-center text-xs font-medium",
                        step === index
                          ? "border-[#17120d] bg-[#17120d] text-white"
                          : step > index
                            ? "border-[#ded6ca] bg-[#eee6da] text-[#17120d]"
                            : "border-[#ded6ca] bg-white text-[#675949]"
                      )}
                    >
                      {step > index ? <Check className="mx-auto size-4" /> : `0${index + 1}`}
                    </div>
                  ))}
                </div>

                {step === 0 ? (
                  <StepBox>
                    <FieldSelect
                      label="City"
                      icon={MapPinned}
                      value={onboarding.city}
                      options={ALGERIA_CITIES}
                      onChange={(value) => setOnboarding((prev) => ({ ...prev, city: value }))}
                    />
                  </StepBox>
                ) : null}

                {step === 1 ? (
                  <StepBox>
                    <ChoiceGrid
                      value={onboarding.useCase}
                      options={ALGERIA_USE_CASES}
                      onChange={(value) =>
                        setOnboarding((prev) => ({ ...prev, useCase: value }))
                      }
                    />
                  </StepBox>
                ) : null}

                {step === 2 ? (
                  <StepBox>
                    <FieldSelect
                      label="Language"
                      icon={Globe}
                      value={onboarding.language}
                      options={LANGUAGES}
                      onChange={(value) =>
                        setOnboarding((prev) => ({ ...prev, language: value }))
                      }
                    />
                    <div className="mt-4">
                      <Field
                        label="Workspace"
                        icon={UserRound}
                        value={onboarding.workspaceName}
                        onChange={(value) =>
                          setOnboarding((prev) => ({ ...prev, workspaceName: value }))
                        }
                        placeholder="Dossier principal"
                      />
                    </div>
                  </StepBox>
                ) : null}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    className="h-11 flex-1 rounded-none border-[#ded6ca] bg-white text-sm text-[#17120d] hover:bg-[#f4efe5]"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="h-11 flex-1 rounded-none bg-[#17120d] text-sm text-white hover:bg-[#2a2117]"
                  >
                    {step === 2 ? "Enter workspace" : "Next"}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogClose className="text-[#675949] hover:bg-white hover:text-[#17120d]" />
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  icon: typeof Mail
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[0.72rem] font-medium text-[#675949] uppercase">
        <Icon className="size-3.5 text-[color:var(--jp-accent)]" />
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full border border-[#ded6ca] bg-white px-4 text-sm text-[#17120d] outline-none transition focus:ring-2 focus:ring-[#d6a850]/25"
      />
    </label>
  )
}

function FieldSelect({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string
  icon: typeof Mail
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[0.72rem] font-medium text-[#675949] uppercase">
        <Icon className="size-3.5 text-[color:var(--jp-accent)]" />
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full border border-[#ded6ca] bg-white px-4 text-sm text-[#17120d] outline-none transition focus:ring-2 focus:ring-[#d6a850]/25"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function StepBox({ children }: { children: ReactNode }) {
  return (
    <div className="border border-[#ded6ca] bg-white p-4">
      {children}
    </div>
  )
}

function ChoiceGrid({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "border px-4 py-4 text-left text-sm transition",
            value === option
              ? "border-[#17120d] bg-[#17120d] text-white"
              : "border-[#ded6ca] bg-white text-[#4b3825] hover:bg-[#f4efe5]"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
