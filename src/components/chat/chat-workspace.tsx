import { useChatbot } from "@/hooks/use-chatbot"

import { ChatComposer } from "./chat-composer"
import { ChatList } from "./chat-list"

export function ChatWorkspace() {
  const { draft, loading, messages, send, setDraft } = useChatbot()

  return (
    <section className="relative flex min-h-dvh flex-col">
      <ChatList loading={loading} messages={messages} />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4 md:px-6 md:pb-6">
        <div className="pointer-events-auto w-full max-w-3xl">
          <ChatComposer
            draft={draft}
            loading={loading}
            onDraftChange={setDraft}
            onSubmit={() => send()}
          />
        </div>
      </div>
    </section>
  )
}
