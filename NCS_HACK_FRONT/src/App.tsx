import { Navigate, Route, Routes } from "react-router-dom"

import { getAccessToken } from "./lib/backend"
import { AssistantPage } from "./pages/assistant-page"
import { LandingPage } from "./pages/landing-page"
import { LoginPage } from "./pages/login-page"
import { SettingsPage } from "./pages/settings-page"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getAccessToken()) return <Navigate to="/auth?mode=signin" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<LoginPage />} />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <AssistantPage />
          </ProtectedRoute>
        }
      />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
