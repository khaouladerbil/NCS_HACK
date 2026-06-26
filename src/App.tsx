import { Navigate, Route, Routes, useSearchParams } from "react-router-dom"

import { AssistantPage } from "./pages/assistant-page"
import { LandingPage } from "./pages/landing-page"
import { SettingsPage } from "./pages/settings-page"

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/assistant" element={<AssistantPage />} />
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
