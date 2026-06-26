import { Navigate, Route, Routes } from "react-router-dom"

import { AssistantPage } from "@/pages/assistant-page"
import { SettingsPage } from "@/pages/settings-page"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/assistant" replace />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/assistant" replace />} />
    </Routes>
  )
}

export default App
