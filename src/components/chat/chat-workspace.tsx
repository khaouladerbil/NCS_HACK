import { Button } from "@/components/ui/button"
import { useChatbot } from "@/hooks/use-chatbot"

import { ChatComposer } from "./chat-composer"
import { ChatList } from "./chat-list"

export function ChatWorkspace() {
  const { draft, loading, messages, send, setDraft, starterPrompts } =
    useChatbot()

  return (
    <section className="flex h-full min-h-dvh flex-col gap-4 p-4 md:p-6">
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Prompt Kit
        </div>
        <div className="text-2xl font-medium tracking-tight">Assistant</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {starterPrompts.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            className="rounded-full bg-background text-xs text-muted-foreground"
            onClick={() => send(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>

      <ChatList loading={loading} messages={messages} />
      <ChatComposer
        draft={draft}
        loading={loading}
        onDraftChange={setDraft}
        onReset={() => window.location.reload()}
        onSubmit={() => send()}
      />
    </section>
  )
}
