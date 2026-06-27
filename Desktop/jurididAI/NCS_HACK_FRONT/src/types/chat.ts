export type ChatSource = {
  href: string
  title: string
  description: string
  label: string
}

export type ChatMessage = {
  id: string
  role: "assistant" | "user"
  body: string
  sources?: ChatSource[]
}
