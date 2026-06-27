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
    "lang.subtitle": "Choisissez la langue de l'interface. L'arabe active le mode droite-à-gauche.",
    // Profile
    "profile.firstName": "Prénom",
    "profile.lastName": "Nom",
    "profile.dob": "Date de naissance",
    "profile.phone": "Téléphone",
    "profile.email": "E-mail",
    "profile.password": "Mot de passe",
    "profile.region": "Région",
    // Sidebar
    "sidebar.folders": "DOSSIERS",
    "sidebar.total": "au total",
    "sidebar.settings": "Paramètres",
    // Chat / Consultant
    "chat.placeholder": "Problème, objectif, résultat.",
    "chat.empty.title": "Démarrez une tâche juridique.",
    "chat.empty.subtitle": "Analysez, rédigez, citez, stratégisez.",
    "chat.files": "+ Fichiers",
    "chat.thinking": "Analyse en cours…",
    // Modes
    "mode.consultant": "Consultant",
    "mode.editor": "Éditeur",
    "mode.professor": "Professeur",
    // Editor
    "editor.generate": "Générer",
    "editor.generating": "Génération…",
    "editor.placeholder": "Décrivez le document juridique à générer…",
    "editor.export.docx": "Export DOCX",
    "editor.export.pdf": "Export PDF",
    "editor.loading": "Chargement du document…",
    // Professor / Quiz
    "quiz.title": "Quiz juridique",
    "quiz.subtitle": "Testez vos connaissances en droit algérien.",
    "quiz.description": "Choisissez un thème ou lancez un quiz aléatoire généré par IA.",
    "quiz.random": "Quiz aléatoire",
    "quiz.custom.placeholder": "Votre propre thème juridique…",
    "quiz.custom.launch": "Lancer",
    "quiz.loading": "Génération du quiz par IA...",
    "quiz.new": "Nouveau quiz",
    "quiz.submit": "Voir le score",
    "quiz.history": "Historique des scores",
    "quiz.clear": "Effacer l'historique",
    "quiz.new.theme": "Nouveau quiz sur ce thème",
    "quiz.score.perfect": "Parfait ! Excellent juriste.",
    "quiz.score.good": "Bon résultat ! Continuez à apprendre.",
    "quiz.score.retry": "Révisez et réessayez !",
    // File dialog
    "file.add": "Ajouter un fichier",
    "file.subtitle": "Importez un PDF, une image ou un document, ou créez un brouillon vide.",
    "file.drop": "Glissez un fichier ici ou",
    "file.browse": "parcourir",
    "file.accept": "PDF, DOCX, image, TXT, MD",
    "file.ready": "Fichier importé",
    "file.rename": "renommer ci-dessous",
    "file.name.placeholder": "Nom du fichier…",
    "file.blank.hint": "Laissez vide pour créer un brouillon",
    "file.submit": "Ajouter",
    // Auth
    "auth.title.signin": "Bon retour",
    "auth.title.signup": "Créer un compte",
    "auth.subtitle.signin": "Connectez-vous pour accéder à votre espace.",
    "auth.subtitle.signup": "Votre espace juridique privé vous attend.",
    "auth.google.signin": "Connexion avec Google",
    "auth.google.signup": "Continuer avec Google",
    "auth.name": "Nom complet",
    "auth.email": "Adresse e-mail",
    "auth.password": "Mot de passe",
    "auth.signin": "Connexion",
    "auth.signup": "Inscription",
    "auth.submit.signin": "Se connecter",
    "auth.submit.signup": "Créer mon compte",
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
    "lang.subtitle": "اختر لغة الواجهة. العربية تفعّل وضع اليمين إلى اليسار.",
    "profile.firstName": "الاسم الأول",
    "profile.lastName": "اللقب",
    "profile.dob": "تاريخ الميلاد",
    "profile.phone": "الهاتف",
    "profile.email": "البريد الإلكتروني",
    "profile.password": "كلمة المرور",
    "profile.region": "المنطقة",
    "sidebar.folders": "المجلدات",
    "sidebar.total": "إجمالي",
    "sidebar.settings": "الإعدادات",
    "chat.placeholder": "المشكلة، الهدف، النتيجة.",
    "chat.empty.title": "ابدأ مهمة قانونية.",
    "chat.empty.subtitle": "حلّل، صِغ، استشهد، ضع استراتيجية.",
    "chat.files": "+ ملفات",
    "chat.thinking": "جارٍ التحليل…",
    "mode.consultant": "المستشار",
    "mode.editor": "المحرر",
    "mode.professor": "الأستاذ",
    "editor.generate": "توليد",
    "editor.generating": "جارٍ التوليد…",
    "editor.placeholder": "صف المستند القانوني المطلوب توليده…",
    "editor.export.docx": "تصدير DOCX",
    "editor.export.pdf": "تصدير PDF",
    "editor.loading": "جارٍ تحميل المستند…",
    "quiz.title": "اختبار قانوني",
    "quiz.subtitle": "اختبر معلوماتك في القانون الجزائري.",
    "quiz.description": "اختر موضوعاً أو أطلق اختباراً عشوائياً بالذكاء الاصطناعي.",
    "quiz.random": "اختبار عشوائي",
    "quiz.custom.placeholder": "موضوعك القانوني الخاص…",
    "quiz.custom.launch": "انطلاق",
    "quiz.loading": "جارٍ توليد الاختبار بالذكاء الاصطناعي...",
    "quiz.new": "اختبار جديد",
    "quiz.submit": "عرض النتيجة",
    "quiz.history": "سجل النتائج",
    "quiz.clear": "مسح السجل",
    "quiz.new.theme": "اختبار جديد على نفس الموضوع",
    "quiz.score.perfect": "ممتاز! محامٍ بارع.",
    "quiz.score.good": "نتيجة جيدة! واصل التعلم.",
    "quiz.score.retry": "راجع الدروس وحاول مجدداً!",
    "file.add": "إضافة ملف",
    "file.subtitle": "استورد ملف PDF أو صورة أو مستنداً، أو أنشئ مسودة فارغة.",
    "file.drop": "اسحب ملفاً هنا أو",
    "file.browse": "تصفح",
    "file.accept": "PDF، DOCX، صورة، TXT، MD",
    "file.ready": "تم استيراد الملف",
    "file.rename": "إعادة التسمية أدناه",
    "file.name.placeholder": "اسم الملف…",
    "file.blank.hint": "اتركه فارغاً لإنشاء مسودة",
    "file.submit": "إضافة",
    "auth.title.signin": "مرحباً بعودتك",
    "auth.title.signup": "إنشاء حساب",
    "auth.subtitle.signin": "سجّل الدخول للوصول إلى مساحتك.",
    "auth.subtitle.signup": "مساحتك القانونية الخاصة في انتظارك.",
    "auth.google.signin": "تسجيل الدخول بـ Google",
    "auth.google.signup": "المتابعة بـ Google",
    "auth.name": "الاسم الكامل",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.signin": "تسجيل الدخول",
    "auth.signup": "إنشاء حساب",
    "auth.submit.signin": "تسجيل الدخول",
    "auth.submit.signup": "إنشاء حسابي",
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
    "lang.subtitle": "Choose the interface language. Arabic enables right-to-left mode.",
    "profile.firstName": "First Name",
    "profile.lastName": "Last Name",
    "profile.dob": "Date of Birth",
    "profile.phone": "Phone Number",
    "profile.email": "Email",
    "profile.password": "Password",
    "profile.region": "Region",
    "sidebar.folders": "FOLDERS",
    "sidebar.total": "total",
    "sidebar.settings": "Settings",
    "chat.placeholder": "Issue, objective, output.",
    "chat.empty.title": "Start a legal task.",
    "chat.empty.subtitle": "Review, draft, cite, strategize.",
    "chat.files": "+ Files",
    "chat.thinking": "Thinking…",
    "mode.consultant": "Consultant",
    "mode.editor": "Editor",
    "mode.professor": "Professor",
    "editor.generate": "Generate",
    "editor.generating": "Generating…",
    "editor.placeholder": "Describe the legal document to generate…",
    "editor.export.docx": "Export DOCX",
    "editor.export.pdf": "Export PDF",
    "editor.loading": "Loading document…",
    "quiz.title": "Legal Quiz",
    "quiz.subtitle": "Test your knowledge of Algerian law.",
    "quiz.description": "Choose a topic or launch an AI-generated random quiz.",
    "quiz.random": "Random quiz",
    "quiz.custom.placeholder": "Your own legal topic…",
    "quiz.custom.launch": "Launch",
    "quiz.loading": "Generating quiz with AI...",
    "quiz.new": "New quiz",
    "quiz.submit": "See score",
    "quiz.history": "Score history",
    "quiz.clear": "Clear history",
    "quiz.new.theme": "New quiz on this topic",
    "quiz.score.perfect": "Perfect! Outstanding jurist.",
    "quiz.score.good": "Good result! Keep learning.",
    "quiz.score.retry": "Review and try again!",
    "file.add": "Add a file",
    "file.subtitle": "Import a PDF, image or document, or create an empty draft.",
    "file.drop": "Drag a file here or",
    "file.browse": "browse",
    "file.accept": "PDF, DOCX, image, TXT, MD",
    "file.ready": "File imported",
    "file.rename": "rename below",
    "file.name.placeholder": "File name…",
    "file.blank.hint": "Leave empty to create a draft",
    "file.submit": "Add",
    "auth.title.signin": "Welcome back",
    "auth.title.signup": "Create account",
    "auth.subtitle.signin": "Sign in to access your workspace.",
    "auth.subtitle.signup": "Your private legal workspace awaits.",
    "auth.google.signin": "Sign in with Google",
    "auth.google.signup": "Continue with Google",
    "auth.name": "Full name",
    "auth.email": "Email address",
    "auth.password": "Password",
    "auth.signin": "Sign in",
    "auth.signup": "Sign up",
    "auth.submit.signin": "Sign in",
    "auth.submit.signup": "Create account",
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
