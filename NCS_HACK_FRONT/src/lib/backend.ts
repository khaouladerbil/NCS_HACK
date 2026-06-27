// All paths go through Vite proxy → Django at localhost:8000

type AssistantMessageRequest = {
  message: string
  task?: "qa" | "explain" | "analyze" | "draft" | "lawyer"
  language?: "fr" | "ar" | "en"
  session_id?: number
  legal_request_id?: number
}

type AssistantMessageResponse = {
  answer: string
  session_id: number
  message_id?: number
  citations?: unknown[]
  metadata?: Record<string, unknown>
}

type ApiErrorPayload = {
  detail?: string
  error?: string
  message?: string
}

// ── Token management ──────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem("access")
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh")
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("access", access)
  localStorage.setItem("refresh", refresh)
}

export function clearTokens() {
  localStorage.removeItem("access")
  localStorage.removeItem("refresh")
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload
    return payload.detail ?? payload.error ?? payload.message ?? response.statusText
  } catch {
    return response.statusText
  }
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  })

  // Auto-refresh on 401
  if (res.status === 401) {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      const refreshRes = await fetch("/api/auth/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      if (refreshRes.ok) {
        const { access } = (await refreshRes.json()) as { access: string }
        localStorage.setItem("access", access)
        // Retry original request with new token
        res = await fetch(path, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
            ...(init.headers as Record<string, string> | undefined),
          },
        })
      } else {
        clearTokens()
        window.dispatchEvent(new Event("auth:logout"))
      }
    }
  }

  return res
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const msg = await parseApiError(res)
    throw new Error(msg || "Identifiants incorrects")
  }
  const data = (await res.json()) as { access: string; refresh: string }
  setTokens(data.access, data.refresh)
  return data
}

export async function register(name: string, email: string, password: string) {
  const res = await fetch("/api/auth/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  })
  if (!res.ok) {
    const msg = await parseApiError(res)
    throw new Error(msg || "Erreur lors de l'inscription")
  }
  return res.json()
}

export async function getMe() {
  const res = await apiFetch("/api/auth/me/")
  if (!res.ok) return null
  return res.json() as Promise<{ id: number; username: string; email: string }>
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function sendAssistantMessage(
  payload: AssistantMessageRequest
): Promise<AssistantMessageResponse> {
  const res = await apiFetch("/api/assistant/chat/", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const msg = await parseApiError(res)
    throw new Error(
      res.status === 401 ? "Connexion requise pour utiliser le chatbot." : msg
    )
  }

  return res.json() as Promise<AssistantMessageResponse>
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function getSessions() {
  const res = await apiFetch("/api/assistant/sessions/")
  if (!res.ok) return []
  return res.json() as Promise<{ id: number; title: string; created_at: string }[]>
}

export async function getSessionMessages(sessionId: number) {
  const res = await apiFetch(`/api/assistant/sessions/${sessionId}/`)
  if (!res.ok) return null
  return res.json()
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function uploadAssistantDocument(file: File) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("title", file.name)

  const token = getAccessToken()
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch("/api/assistant/documents/", {
    method: "POST",
    headers,
    body: formData,
  })

  if (!res.ok) {
    const msg = await parseApiError(res)
    throw new Error(
      res.status === 401 ? "Connexion requise pour envoyer un document." : msg
    )
  }

  return res.json()
}

export type DocumentAnalysis = {
  document_type: string
  summary: string
  is_legal_document?: boolean
  fraud_risk: "faible" | "moyen" | "eleve"
  is_suspicious: boolean
  red_flags: string[]
  missing_elements: string[]
  key_points: string[]
  recommendations: string[]
}

export async function generateLegalText(prompt: string, language: "fr" | "ar" | "en" = "fr"): Promise<string> {
  const res = await apiFetch("/api/assistant/generate-legal-text/", {
    method: "POST",
    body: JSON.stringify({ prompt, language }),
  })
  if (!res.ok) {
    const msg = await parseApiError(res)
    throw new Error(msg || "Génération impossible.")
  }
  const data = (await res.json()) as { content: string }
  return data.content
}

export async function analyzeDocument(documentId: number): Promise<DocumentAnalysis> {
  const res = await apiFetch("/api/assistant/analyze-document/", {
    method: "POST",
    body: JSON.stringify({ document_id: documentId }),
  })
  if (!res.ok) {
    const msg = await parseApiError(res)
    throw new Error(msg || "Analyse impossible.")
  }
  const data = (await res.json()) as { analysis: DocumentAnalysis }
  return data.analysis
}

// ── Drafts ────────────────────────────────────────────────────────────────────

export async function getDrafts() {
  const res = await apiFetch("/api/assistant/drafts/")
  if (!res.ok) return []
  return res.json()
}

export async function createDraft(payload: {
  message: string
  document_type: string
  output_format?: string
  session_id?: number
}) {
  const res = await apiFetch("/api/assistant/draft/", {
    method: "POST",
    body: JSON.stringify({ output_format: "pdf", ...payload }),
  })
  if (!res.ok) {
    const msg = await parseApiError(res)
    throw new Error(msg)
  }
  return res.json()
}

// ── Lawyers ───────────────────────────────────────────────────────────────────

export async function getLawyers() {
  const res = await apiFetch("/api/assistant/lawyers/")
  if (!res.ok) return []
  return res.json()
}

export async function recommendLawyer(query: string, wilaya?: string) {
  const res = await apiFetch("/api/assistant/recommend-lawyer/", {
    method: "POST",
    body: JSON.stringify({ query, wilaya }),
  })
  if (!res.ok) return null
  return res.json()
}

export async function generateQuiz(topic?: string) {
  const res = await apiFetch("/api/assistant/quiz/", {
    method: "POST",
    body: JSON.stringify({ topic: topic ?? "" }),
  })
  if (!res.ok) throw new Error("Impossible de générer le quiz.")
  return res.json()
}
