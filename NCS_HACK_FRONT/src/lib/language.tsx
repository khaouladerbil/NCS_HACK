import { createContext, useContext, useEffect, useState } from "react"

export type AppLang = "fr" | "ar" | "en"

export const LANG_LABELS: Record<AppLang, string> = {
  fr: "Français",
  ar: "العربية",
  en: "English",
}

export const T: Record<AppLang, Record<string, string>> = {
  fr: {
    // Settings nav
    "nav.profile": "Profil",
    "nav.appearance": "Apparence",
    "nav.language": "Langue",
    "nav.notifications": "Notifications",
    "nav.security": "Sécurité",
    "nav.billing": "Facturation",
    // Settings page
    "settings.title": "Paramètres",
    "settings.back": "Retour",
    "settings.save": "Enregistrer",
    "settings.saved": "Enregistré",
    // Language section
    "lang.title": "Langue d'affichage",
    "lang.subtitle": "Choisissez la langue de l'interface. L'arabe active le mode droite-à-gauche.",
    // Profile
    "profile.firstName": "Prénom",
    "profile.lastName": "Nom",
    "profile.dob": "Date de naissance",
    "profile.phone": "Téléphone",
    "profile.email": "E-mail",
    "profile.password": "Mot de passe",
    "profile.region": "Région",
    // Chat
    "chat.placeholder": "Posez votre question juridique...",
    "chat.send": "Envoyer",
    // Auth
    "auth.signin": "Connexion",
    "auth.signup": "Inscription",
    "auth.email": "E-mail",
    "auth.password": "Mot de passe",
    "auth.loading": "Chargement...",
  },
  ar: {
    "nav.profile": "الملف الشخصي",
    "nav.appearance": "المظهر",
    "nav.language": "اللغة",
    "nav.notifications": "الإشعارات",
    "nav.security": "الأمان",
    "nav.billing": "الفواتير",
    "settings.title": "الإعدادات",
    "settings.back": "رجوع",
    "settings.save": "حفظ",
    "settings.saved": "تم الحفظ",
    "lang.title": "لغة العرض",
    "lang.subtitle": "اختر لغة الواجهة. العربية تفعّل وضع اليمين إلى اليسار.",
    "profile.firstName": "الاسم الأول",
    "profile.lastName": "اللقب",
    "profile.dob": "تاريخ الميلاد",
    "profile.phone": "الهاتف",
    "profile.email": "البريد الإلكتروني",
    "profile.password": "كلمة المرور",
    "profile.region": "المنطقة",
    "chat.placeholder": "اطرح سؤالك القانوني...",
    "chat.send": "إرسال",
    "auth.signin": "تسجيل الدخول",
    "auth.signup": "إنشاء حساب",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.loading": "جارٍ التحميل...",
  },
  en: {
    "nav.profile": "Profile",
    "nav.appearance": "Appearance",
    "nav.language": "Language",
    "nav.notifications": "Notifications",
    "nav.security": "Security",
    "nav.billing": "Billing",
    "settings.title": "Settings",
    "settings.back": "Back",
    "settings.save": "Save",
    "settings.saved": "Saved",
    "lang.title": "Display Language",
    "lang.subtitle": "Choose the interface language. Arabic enables right-to-left mode.",
    "profile.firstName": "First Name",
    "profile.lastName": "Last Name",
    "profile.dob": "Date of Birth",
    "profile.phone": "Phone Number",
    "profile.email": "Email",
    "profile.password": "Password",
    "profile.region": "Region",
    "chat.placeholder": "Ask your legal question...",
    "chat.send": "Send",
    "auth.signin": "Sign in",
    "auth.signup": "Sign up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.loading": "Loading...",
  },
}

type LangCtx = {
  lang: AppLang
  setLang: (l: AppLang) => void
  t: (key: string) => string
  isRTL: boolean
}

const LangContext = createContext<LangCtx>({
  lang: "fr",
  setLang: () => {},
  t: (k) => k,
  isRTL: false,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLang>(() => {
    return (localStorage.getItem("app_lang") as AppLang) ?? "fr"
  })

  const setLang = (l: AppLang) => {
    setLangState(l)
    localStorage.setItem("app_lang", l)
  }

  const isRTL = lang === "ar"

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang)
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr")
  }, [lang, isRTL])

  const t = (key: string) => T[lang][key] ?? T["fr"][key] ?? key

  return <LangContext.Provider value={{ lang, setLang, t, isRTL }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}
