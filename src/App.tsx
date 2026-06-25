import { Navigate, Route, Routes } from "react-router-dom"

import { AssistantPage } from "@/pages/assistant-page"
import { IntakePage } from "@/pages/intake-page"
import { MattersPage } from "@/pages/matters-page"
import { ResearchPage } from "@/pages/research-page"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/assistant" replace />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/intake" element={<IntakePage />} />
      <Route path="/matters" element={<MattersPage />} />
      <Route path="/research" element={<ResearchPage />} />
    </Routes>
  )
}

export default App
