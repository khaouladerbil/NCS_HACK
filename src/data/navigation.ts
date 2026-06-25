import { Bot, Folder, Search, Sparkles } from "lucide-react"

import type { NavItem } from "@/types/navigation"

export const primaryNav: NavItem[] = [
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/intake", label: "Intake", icon: Sparkles },
  { to: "/matters", label: "Matters", icon: Folder },
  { to: "/research", label: "Research", icon: Search },
]

export const sideNotes: Record<string, string[]> = {
  "/assistant": ["Live chat", "Pinned prompt", "Minimal shell"],
  "/intake": ["Short form", "Needs build", "Shared comps"],
  "/matters": ["List view", "Needs build", "Thin page"],
  "/research": ["Sources", "Needs build", "Same shell"],
}
