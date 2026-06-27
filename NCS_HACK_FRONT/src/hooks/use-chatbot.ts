import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react"

import { initialMessages, makeReply, starterPrompts } from "@/data/chat"
import type { ChatMessage } from "@/types/chat"

export function useChatbot() {
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<number | null>(null)

  const finishReply = useEffectEvent((prompt: string) => {
    startTransition(() => {
      setMessages((current) => [...current, makeReply(prompt)])
      setLoading(false)
    })
  })

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    },
    []
  )

  function send(next?: string) {
    const content = (next ?? draft).trim()

    if (!content || loading) {
      return
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      body: content,
    }

    startTransition(() => {
      setMessages((current) => [...current, userMessage])
      setDraft("")
      setLoading(true)
    })

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
    }

    timerRef.current = window.setTimeout(() => finishReply(content), 600)
  }

  return {
    draft,
    loading,
    messages,
    send,
    setDraft,
    starterPrompts,
  }
}
