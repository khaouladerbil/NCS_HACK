import type { ChatMessage } from "@/types/chat"

export const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    body:
      "JusticePath ready.\n\nState issue, deadline, wanted output. I return terse draft, checklist, or explainer.",
    sources: [
      {
        href: "https://www.prompt-kit.com/docs/installation",
        label: "Prompt Kit",
        title: "Prompt Kit installation",
        description: "Component system used for this chat UI.",
      },
    ],
  },
]

export const starterPrompts = [
  "Draft tenant lockout note.",
  "Summarize appeal deadline.",
  "Make intake checklist.",
]

export function makeReply(prompt: string): ChatMessage {
  const text = prompt.toLowerCase()

  if (text.includes("tenant") || text.includes("lockout")) {
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      body:
        "Fast path:\n\n1. Confirm lockout time.\n2. Save lease, texts, photos.\n3. Draft same-day demand.\n4. Escalate local aid if shelter, meds, child safety at risk.",
      sources: [
        {
          href: "https://www.lawhelp.org/",
          label: "LawHelp",
          title: "LawHelp.org",
          description: "State legal help directory.",
        },
      ],
    }
  }

  if (text.includes("appeal") || text.includes("benefit")) {
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      body:
        "Appeal frame:\n\n- Name agency action.\n- Mark notice date.\n- Mark filing deadline.\n- Ask continuation if allowed.\n- List missing records.",
      sources: [
        {
          href: "https://www.usa.gov/social-services",
          label: "USA.gov",
          title: "Social services resources",
          description: "Government starting point for benefits information.",
        },
      ],
    }
  }

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    body:
      "Need 3 facts:\n\n- issue\n- deadline\n- output\n\nThen I shape reply.",
    sources: [
      {
        href: "https://www.prompt-kit.com/primitives/chatbot",
        label: "Chatbot",
        title: "Prompt Kit chatbot primitive",
        description: "Reference pattern for compact AI chat surfaces.",
      },
    ],
  }
}
