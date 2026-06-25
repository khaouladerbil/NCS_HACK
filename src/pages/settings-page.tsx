import { useState } from "react"
import {
  User,
  Shield,
  Bell,
  Palette,
  CreditCard,
  ChevronRight,
  Camera,
  Mail,
  Building2,
  Briefcase,
  Globe,
  Phone,
  Save,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NavLink } from "react-router-dom"

// ─── Mock user data ────────────────────────────────────────────────────────────

const USER = {
  name: "Alexandra Morgan",
  email: "a.morgan@lawfirm.io",
  role: "Senior Partner",
  organisation: "Morgan & Associates LLP",
  phone: "+44 20 7946 0958",
  website: "morganassociates.law",
  location: "London, United Kingdom",
  initials: "AM",
  plan: "Enterprise",
  memberSince: "March 2023",
}

// ─── Nav sections ─────────────────────────────────────────────────────────────

const SETTINGS_NAV = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
]

// ─── Profile Section ──────────────────────────────────────────────────────────

function ProfileSection() {
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: USER.name,
    email: USER.email,
    role: USER.role,
    organisation: USER.organisation,
    phone: USER.phone,
    website: USER.website,
    location: USER.location,
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const fields: {
    key: keyof typeof form
    label: string
    icon: React.ElementType
    type?: string
  }[] = [
    { key: "name", label: "Full Name", icon: User },
    { key: "email", label: "Email Address", icon: Mail, type: "email" },
    { key: "role", label: "Job Title", icon: Briefcase },
    { key: "organisation", label: "Organisation", icon: Building2 },
    { key: "phone", label: "Phone", icon: Phone, type: "tel" },
    { key: "website", label: "Website", icon: Globe },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Avatar card */}
      <div className="flex items-center gap-6 rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur">
        <div className="relative shrink-0">
          <div className="size-20 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-md">
            {USER.initials}
          </div>
          <button className="absolute -bottom-1 -right-1 size-7 rounded-full bg-primary border-2 border-background flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors">
            <Camera className="size-3 text-primary-foreground" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{USER.name}</h2>
          <p className="text-sm text-muted-foreground">{USER.role} · {USER.organisation}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              {USER.plan}
            </span>
            <span className="text-xs text-muted-foreground">Member since {USER.memberSince}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 rounded-xl">
          Change photo
        </Button>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur">
        <h3 className="text-sm font-semibold text-foreground mb-5">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ key, label, icon: Icon, type }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Icon className="size-3" />
                {label}
              </label>
              <input
                type={type ?? "text"}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/50 transition-shadow placeholder:text-muted-foreground"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            size="sm"
            className="rounded-xl gap-2 min-w-28"
            onClick={handleSave}
          >
            {saved ? (
              <>
                <Check className="size-3.5" />
                Saved
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="text-sm font-semibold text-destructive mb-1">Danger Zone</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-xl">
          Delete Account
        </Button>
      </div>
    </div>
  )
}

// ─── Placeholder sections ─────────────────────────────────────────────────────

function PlaceholderSection({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-60 rounded-2xl border border-border/60 bg-card/70 backdrop-blur">
      <p className="text-sm text-muted-foreground">{label} — coming soon</p>
    </div>
  )
}

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [section, setSection] = useState("profile")

  const current = SETTINGS_NAV.find((n) => n.id === section)

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 h-12 flex items-center px-4 gap-3 border-b border-border/60 bg-background/90 backdrop-blur shrink-0">
        <NavLink
          to="/assistant"
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:opacity-80 transition-opacity"
        >
          <div className="size-6 rounded-md bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
            J
          </div>
          JusticePath
        </NavLink>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Settings</span>
        {current && (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <span className="text-sm text-foreground">{current.label}</span>
          </>
        )}
      </header>

      <div className="flex flex-1 max-w-5xl mx-auto w-full px-4 py-8 gap-8">
        {/* Sidebar nav */}
        <nav className="w-48 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-3 mb-2">
            Settings
          </p>
          <div className="flex flex-col gap-0.5">
            {SETTINGS_NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left w-full",
                  section === id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-6">
            {current?.label}
          </h1>

          {section === "profile" && <ProfileSection />}
          {section === "appearance" && <PlaceholderSection label="Appearance" />}
          {section === "notifications" && <PlaceholderSection label="Notifications" />}
          {section === "security" && <PlaceholderSection label="Security" />}
          {section === "billing" && <PlaceholderSection label="Billing & Plan" />}
        </main>
      </div>
    </div>
  )
}
