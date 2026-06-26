import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Toast } from "@heroui/react"
import { BrowserRouter } from "react-router-dom"

import App from "@/App"
import { TooltipProvider } from "@/components/ui/tooltip"

import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Toast.Provider width="fit-content" />
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </BrowserRouter>
  </StrictMode>
)
