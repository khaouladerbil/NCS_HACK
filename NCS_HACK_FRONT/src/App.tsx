import { Navigate, Route, Routes, useSearchParams } from "react-router-dom"

import { getAccessToken } from "./lib/backend"
import { AssistantPage } from "./pages/assistant-page"
import { LandingPage } from "./pages/landing-page"
import { SettingsPage } from "./pages/settings-page"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getAccessToken()) return <Navigate to="/?auth=signin" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <AssistantPage />
          </ProtectedRoute>
        }
      />
      <Route path="/auth" element={<AuthRedirect />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AuthRedirect() {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get("mode") === "login" ? "signin" : "signup"
  return <Navigate to={`/?auth=${mode}`} replace />
}

export default App
