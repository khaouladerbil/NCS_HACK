import {
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  Check,
  CreditCard,
  Crown,
  Globe,
  KeyRound,
  Lock,
  Mail,
  MapPinned,
  MessageSquare,
  Moon,
  Palette,
  Phone,
  Save,
  Shield,
  Sparkles,
  Sun,
  SunMoon,
  User,
  Zap,
} from "lucide-react"
import { useEffect, useState, type ElementType } from "react"
import { toast } from "@heroui/react"
import { NavLink } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"

import { type AppLang, LANG_LABELS, useLang } from "@/lib/language"
import { cn } from "@/lib/utils"
import logoMark from "../../Logo.svg"

// ── Theme ──────────────────────────────────────────────────────────────────

type AppTheme = "light" | "dark" | "system"

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: AppTheme) {
  const root = document.documentElement
  const resolved = theme === "system" ? getSystemTheme() : theme
  root.classList.toggle("dark", resolved === "dark")
}

function useTheme() {
  const [theme, setThemeState] = useState<AppTheme>(
    () => (localStorage.getItem("app_theme") as AppTheme) ?? "light"
  )
  const setTheme = (t: AppTheme) => {
    setThemeState(t)
    localStorage.setItem("app_theme", t)
    applyTheme(t)
  }
  useEffect(() => { applyTheme(theme) }, [theme])
  return { theme, setTheme }
}

// ── Data ───────────────────────────────────────────────────────────────────

const USER = {
  firstName: "Alexandra",
  lastName: "Morgan",
  dob: "1989-04-16",
  email: "a.morgan@lawfirm.io",
  phone: "+44 20 7946 0958",
  password: "********",
  region: "London, United Kingdom",
}

const SETTINGS_NAV = [
  { id: "profile",       labelKey: "nav.profile",       icon: User },
  { id: "appearance",    labelKey: "nav.appearance",    icon: Palette },
  { id: "language",      labelKey: "nav.language",      icon: Globe },
  { id: "notifications", labelKey: "nav.notifications", icon: Bell },
  { id: "billing",       labelKey: "nav.billing",       icon: CreditCard },
  { id: "security",      labelKey: "nav.security",      icon: Shield },
]

const LANG_META: Record<AppLang, { flag: string; native: string; region: string }> = {
  fr: { flag: "🇫🇷", native: "Français",  region: "France / Maghreb" },
  ar: { flag: "🇩🇿", native: "العربية",   region: "Algérie · RTL" },
  en: { flag: "🇬🇧", native: "English",   region: "United Kingdom" },
}

const PLANS = [
  {
    id: "free",
    name: "Gratuit",
    price: "0",
    period: "",
    icon: Zap,
    accent: "text-[#8a7762]",
    border: "border-[#e5dbd0]",
    bg: "bg-white",
    limits: [
      "20 messages / mois",
      "5 quiz / mois",
      "3 analyses de documents",
      "1 dossier actif",
    ],
    cta: "Plan actuel",
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "990 DA",
    period: "/ mois",
    icon: Sparkles,
    accent: "text-[#291c08]",
    border: "border-[#291c08]",
    bg: "bg-[#faf7f4]",
    badge: "Recommandé",
    limits: [
      "Messages illimités",
      "Quiz illimités",
      "Analyses illimitées",
      "Dossiers illimités",
      "Génération de documents",
      "Export DOCX & PDF",
    ],
    cta: "Passer au Pro",
    current: false,
  },
  {
    id: "firm",
    name: "Cabinet",
    price: "3 900 DA",
    period: "/ mois",
    icon: Crown,
    accent: "text-[#b1842f]",
    border: "border-[#e8c87a]",
    bg: "bg-[#fffbf0]",
    limits: [
      "Tout le plan Pro",
      "Jusqu'à 10 comptes",
      "Espace partagé d'équipe",
      "Support dédié 24 / 7",
      "Rapports d'activité",
      "Accès API",
    ],
    cta: "Contacter l'équipe",
    current: false,
  },
]

// ── Toggle switch ──────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-[#291c08]" : "bg-[#d6cfc5]"
      )}
    >
      <span
        className={cn(
          "inline-block size-3.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  )
}

// ── Sections ───────────────────────────────────────────────────────────────

function ProfileSection() {
  const { t } = useLang()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ ...USER })

  const fields: { key: keyof typeof USER; labelKey: string; icon: ElementType; type?: string }[] = [
    { key: "firstName", labelKey: "profile.firstName", icon: User },
    { key: "lastName",  labelKey: "profile.lastName",  icon: User },
    { key: "dob",       labelKey: "profile.dob",       icon: Calendar, type: "date" },
    { key: "phone",     labelKey: "profile.phone",     icon: Phone,    type: "tel" },
    { key: "email",     labelKey: "profile.email",     icon: Mail,     type: "email" },
    { key: "password",  labelKey: "profile.password",  icon: KeyRound, type: "password" },
    { key: "region",    labelKey: "profile.region",    icon: MapPinned },
  ]

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, labelKey, icon: Icon, type }) => (
          <div
            key={key}
            className={cn("space-y-1.5", (key === "region" || key === "email") ? "sm:col-span-2" : "")}
          >
            <label className="flex items-center gap-1.5 text-[0.72rem] font-medium uppercase tracking-[0.1em] text-[#8a7762]">
              <Icon className="size-3" />
              {t(labelKey)}
            </label>
            <input
              type={type ?? "text"}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="h-11 w-full rounded-xl border border-[#e5dbd0] bg-white px-3.5 text-[0.88rem] text-[#291c08] outline-none transition focus:border-[#291c08]/40 focus:ring-2 focus:ring-[#291c08]/8"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => { setSaved(true); toast(t("settings.saved")); setTimeout(() => setSaved(false), 2500) }}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#291c08] px-5 text-[0.84rem] font-semibold text-white transition hover:bg-[#1d1406]"
      >
        {saved ? <><Check className="size-4" />{t("settings.saved")}</> : <><Save className="size-4" />{t("settings.save")}</>}
      </button>
    </section>
  )
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  const THEMES: { id: AppTheme; label: string; icon: typeof Sun; preview: string }[] = [
    {
      id: "light",
      label: "Clair",
      icon: Sun,
      preview: "bg-[linear-gradient(135deg,#f8f2e7_50%,#efe7d7_100%)]",
    },
    {
      id: "dark",
      label: "Sombre",
      icon: Moon,
      preview: "bg-[linear-gradient(135deg,#1a1208_50%,#0d0a04_100%)]",
    },
    {
      id: "system",
      label: "Système",
      icon: SunMoon,
      preview: "bg-[linear-gradient(135deg,#f8f2e7_50%,#1a1208_50%)]",
    },
  ]

  return (
    <section className="space-y-6">
      <div>
        <p className="text-[0.84rem] text-[#8a7762]">
          Choisissez l'apparence de l'interface. Le mode sombre réduit la fatigue oculaire.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {THEMES.map(({ id, label, icon: Icon, preview }) => {
          const active = theme === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl border-2 transition-all",
                active ? "border-[#291c08] shadow-md" : "border-[#e5dbd0] hover:border-[#c4b49a]"
              )}
            >
              {/* Preview box */}
              <div className={cn("h-20 w-full", preview)}>
                <div className="flex h-full flex-col justify-end p-2 gap-1">
                  <div className={cn("h-1.5 w-3/4 rounded-full", id === "dark" ? "bg-white/20" : "bg-[#291c08]/15")} />
                  <div className={cn("h-1.5 w-1/2 rounded-full", id === "dark" ? "bg-white/10" : "bg-[#291c08]/8")} />
                </div>
              </div>
              {/* Label */}
              <div className={cn(
                "flex items-center justify-between px-3 py-2.5",
                active ? "bg-[#291c08]" : "bg-white"
              )}>
                <div className="flex items-center gap-1.5">
                  <Icon className={cn("size-3.5", active ? "text-white" : "text-[#8a7762]")} />
                  <span className={cn("text-[0.8rem] font-medium", active ? "text-white" : "text-[#291c08]")}>
                    {label}
                  </span>
                </div>
                {active && <Check className="size-3.5 text-white" />}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function LanguageSection() {
  const { lang, setLang } = useLang()

  return (
    <section className="space-y-4">
      <p className="text-[0.84rem] text-[#8a7762]">
        La langue choisie s'applique à toute l'interface. L'arabe active le mode droite-à-gauche.
      </p>

      <div className="space-y-2">
        {(Object.entries(LANG_META) as [AppLang, typeof LANG_META[AppLang]][]).map(([code, meta]) => {
          const active = lang === code
          return (
            <button
              key={code}
              type="button"
              onClick={() => { setLang(code); toast(`${meta.flag} ${meta.native}`) }}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-all",
                active
                  ? "border-[#291c08] bg-[#291c08]"
                  : "border-[#e5dbd0] bg-white hover:border-[#c4b49a] hover:bg-[#faf7f4]"
              )}
            >
              <span className="text-2xl">{meta.flag}</span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[0.88rem] font-semibold", active ? "text-white" : "text-[#291c08]")}>
                  {meta.native}
                </p>
                <p className={cn("text-[0.72rem]", active ? "text-white/60" : "text-[#8a7762]")}>
                  {meta.region} · {LANG_LABELS[code]}
                </p>
              </div>
              <div className={cn(
                "flex size-5 items-center justify-center rounded-full border-2 shrink-0 transition-all",
                active ? "border-white bg-white" : "border-[#d6cfc5] bg-transparent"
              )}>
                {active && <div className="size-2 rounded-full bg-[#291c08]" />}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function NotificationsSection() {
  const [notifs, setNotifs] = useState({
    newFeatures: true,
    weeklyDigest: true,
    taskReminders: false,
    security: true,
    aiUpdates: false,
  })

  const toggle = (key: keyof typeof notifs) =>
    setNotifs((p) => ({ ...p, [key]: !p[key] }))

  const rows: { key: keyof typeof notifs; icon: ElementType; label: string; description: string }[] = [
    {
      key: "newFeatures",
      icon: Sparkles,
      label: "Nouvelles fonctionnalités",
      description: "Soyez informé des mises à jour et nouvelles fonctions de JusticePath.",
    },
    {
      key: "weeklyDigest",
      icon: MessageSquare,
      label: "Résumé hebdomadaire",
      description: "Un résumé de vos activités et des tendances juridiques chaque semaine.",
    },
    {
      key: "taskReminders",
      icon: Bell,
      label: "Rappels de tâches",
      description: "Rappels pour les délais et documents en attente.",
    },
    {
      key: "security",
      icon: Shield,
      label: "Alertes de sécurité",
      description: "Notifications en cas d'activité inhabituelle sur votre compte.",
    },
    {
      key: "aiUpdates",
      icon: BellOff,
      label: "Mises à jour IA",
      description: "Informations sur les améliorations des modèles d'analyse juridique.",
    },
  ]

  return (
    <section className="space-y-2">
      {rows.map(({ key, icon: Icon, label, description }) => (
        <div
          key={key}
          className="flex items-start justify-between gap-4 rounded-xl border border-[#e5dbd0] bg-white px-4 py-4"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f0ea]">
              <Icon className="size-3.5 text-[#8a7762]" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.86rem] font-medium text-[#291c08]">{label}</p>
              <p className="mt-0.5 text-[0.75rem] text-[#8a7762]">{description}</p>
            </div>
          </div>
          <Toggle checked={notifs[key]} onChange={() => toggle(key)} />
        </div>
      ))}
    </section>
  )
}

function BillingSection() {
  return (
    <section className="space-y-5">
      {/* Current plan */}
      <div className="flex items-center gap-3 rounded-xl border border-[#e5dbd0] bg-white px-4 py-3.5">
        <div className="flex size-9 items-center justify-center rounded-full bg-[#f5f0ea]">
          <Zap className="size-4 text-[#8a7762]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[0.86rem] font-semibold text-[#291c08]">Plan Gratuit · Actif</p>
          <p className="text-[0.75rem] text-[#8a7762]">Quiz, analyses et messages limités ce mois-ci</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-[#c4b49a]">Actuel</p>
        </div>
      </div>

      {/* Plans */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-[1.25rem] border-2 p-5",
                plan.border, plan.bg
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#291c08] px-3 py-0.5 text-[0.68rem] font-semibold text-white">
                  {plan.badge}
                </span>
              )}

              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl border border-[#e5dbd0] bg-white/80">
                  <Icon className={cn("size-4", plan.accent)} />
                </div>
                <p className="text-[0.95rem] font-bold text-[#291c08]">{plan.name}</p>
              </div>

              <div className="mb-4">
                <span className="text-[1.5rem] font-bold text-[#291c08]">{plan.price}</span>
                {plan.period && <span className="ml-1 text-[0.76rem] text-[#8a7762]">{plan.period}</span>}
              </div>

              <ul className="mb-5 flex-1 space-y-2">
                {plan.limits.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[0.78rem] text-[#5b4f43]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#291c08]" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={plan.current}
                onClick={() => !plan.current && toast(`Paiement ${plan.name} — bientôt disponible`)}
                className={cn(
                  "mt-auto flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-[0.82rem] font-semibold transition",
                  plan.current
                    ? "cursor-default border border-[#e5dbd0] bg-[#f5f0ea] text-[#a0917e]"
                    : plan.id === "firm"
                    ? "border-2 border-[#291c08] bg-transparent text-[#291c08] hover:bg-[#faf7f4]"
                    : "bg-[#291c08] text-white shadow-[0_6px_18px_rgba(41,28,8,0.18)] hover:bg-[#1d1406]"
                )}
              >
                {plan.current && <Lock className="size-3.5" />}
                {plan.cta}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-center text-[0.72rem] text-[#b5a899]">
        Paiement sécurisé · Résiliable à tout moment · Facturation en Dinars algériens (DA)
      </p>
    </section>
  )
}

function ComingSoonSection({ icon: Icon, title }: { icon: ElementType; title: string }) {
  return (
    <section className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-[#e5dbd0] bg-white">
        <Icon className="size-6 text-[#c4b49a]" />
      </div>
      <p className="mt-4 text-[0.88rem] font-medium text-[#6b5c4d]">{title}</p>
      <p className="mt-1 text-[0.78rem] text-[#b5a899]">Disponible prochainement</p>
    </section>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { t } = useLang()
  const [section, setSection] = useState("profile")
  const current = SETTINGS_NAV.find((item) => item.id === section)

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(188,162,121,0.12),transparent_30%),linear-gradient(180deg,#f8f2e7_0%,#efe7d7_100%)]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-[#e8ddd1]/60 bg-[#f8f2e7]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <NavLink
            to="/assistant"
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.8rem] font-medium text-[#6b5c4d] transition hover:bg-[#f0ebe4] hover:text-[#291c08]"
          >
            <ArrowLeft className="size-4" />
            {t("settings.back")}
          </NavLink>
          <div className="flex items-center gap-2">
            <img src={logoMark} alt="JusticePath" className="h-7 w-auto" />
            <span className="font-[Georgia,Times_New_Roman,serif] text-[1rem] tracking-[-0.03em] text-[#291c08]">
              {t("settings.title")}
            </span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="grid gap-6 lg:grid-cols-[13rem_1fr]">

          {/* Side nav */}
          <nav className="space-y-0.5 rounded-[1.5rem] border border-[#e8ddd1] bg-white/80 p-2 shadow-[0_8px_24px_rgba(41,28,8,0.06)] lg:h-fit">
            {SETTINGS_NAV.map(({ id, labelKey, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[0.84rem] font-medium transition-all",
                  section === id
                    ? "bg-[#291c08] text-white shadow-sm"
                    : "text-[#6b5c4d] hover:bg-[#f5f0ea] hover:text-[#291c08]"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {t(labelKey)}
              </button>
            ))}
          </nav>

          {/* Panel */}
          <div className="rounded-[1.5rem] border border-[#e8ddd1] bg-white/90 p-6 shadow-[0_8px_24px_rgba(41,28,8,0.06)] sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={section}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <h1 className="mb-6 font-[Georgia,Times_New_Roman,serif] text-[1.4rem] tracking-[-0.03em] text-[#1a0f04]">
                  {current ? t(current.labelKey) : ""}
                </h1>

                {section === "profile"       && <ProfileSection />}
                {section === "appearance"    && <AppearanceSection />}
                {section === "language"      && <LanguageSection />}
                {section === "notifications" && <NotificationsSection />}
                {section === "billing"       && <BillingSection />}
                {section === "security"      && <ComingSoonSection icon={Shield} title="Sécurité" />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
