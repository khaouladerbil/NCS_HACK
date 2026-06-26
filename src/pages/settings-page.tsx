import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  CreditCard,
  KeyRound,
  Mail,
  Palette,
  Phone,
  MapPinned,
  Save,
  Shield,
  User,
} from "lucide-react"
import { useState } from "react"
import { toast } from "@heroui/react"
import { NavLink } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
]

function ProfileSection() {
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    firstName: USER.firstName,
    lastName: USER.lastName,
    dob: USER.dob,
    email: USER.email,
    phone: USER.phone,
    password: USER.password,
    region: USER.region,
  })

  const handleSave = () => {
    setSaved(true)
    toast("Settings saved")
    setTimeout(() => setSaved(false), 2500)
  }

  const fields: {
    key: keyof typeof form
    label: string
    icon: React.ElementType
    type?: string
  }[] = [
    { key: "firstName", label: "First Name", icon: User },
    { key: "lastName", label: "Last Name", icon: User },
    { key: "dob", label: "Date of Birth", icon: Calendar, type: "date" },
    { key: "phone", label: "Phone Number", icon: Phone, type: "tel" },
    { key: "email", label: "Email", icon: Mail, type: "email" },
    { key: "password", label: "Password", icon: KeyRound, type: "password" },
    { key: "region", label: "Region", icon: MapPinned },
  ]

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, icon: Icon, type }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Icon className="size-3" />
              {label}
            </label>
            <input
              type={type ?? "text"}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring/50"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button size="sm" className="min-w-28 gap-2" onClick={handleSave}>
          {saved ? (
            <>
              <Check className="size-3.5" />
              Saved
            </>
          ) : (
            <>
              <Save className="size-3.5" />
              Save
            </>
          )}
        </Button>
      </div>
    </section>
  )
}

function PlaceholderSection({ label }: { label: string }) {
  return (
    <section>
      <p className="text-sm text-muted-foreground">{label} settings coming soon.</p>
    </section>
  )
}

export function SettingsPage() {
  const [section, setSection] = useState("profile")
  const current = SETTINGS_NAV.find((item) => item.id === section)

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <p className="text-sm font-medium text-foreground">Settings</p>
          <NavLink to="/assistant">
            <Button variant="ghost" size="icon-sm" aria-label="Back to assistant">
              <ArrowLeft className="size-4" />
            </Button>
          </NavLink>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-6">
        <nav className="hidden w-52 shrink-0 lg:block">
          <div className="flex flex-col gap-1">
            {SETTINGS_NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={cn(
                  "flex w-full items-center gap-2 px-2 py-2 text-left text-sm",
                  section === id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
            {SETTINGS_NAV.map(({ id, label }) => (
              <Button
                key={id}
                variant={section === id ? "default" : "outline"}
                size="sm"
                onClick={() => setSection(id)}
              >
                {label}
              </Button>
            ))}
          </div>

          <h1 className="mb-6 text-lg font-medium text-foreground">{current?.label}</h1>

          {section === "profile" && <ProfileSection />}
          {section === "appearance" && <PlaceholderSection label="Appearance" />}
          {section === "notifications" && <PlaceholderSection label="Notifications" />}
          {section === "security" && <PlaceholderSection label="Security" />}
          {section === "billing" && <PlaceholderSection label="Billing" />}
        </main>
      </div>
    </div>
  )
}
