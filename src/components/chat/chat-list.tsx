import { ChatContainerContent, ChatContainerRoot, ChatContainerScrollAnchor } from "@/components/ui/chat-container"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import { ScrollButton } from "@/components/ui/scroll-button"
import { Source, SourceContent, SourceTrigger } from "@/components/ui/source"
import { TextShimmer } from "@/components/ui/text-shimmer"
import type { ChatMessage } from "@/types/chat"

type ChatListProps = {
  loading: boolean
  messages: ChatMessage[]
}

export function ChatList({ loading, messages }: ChatListProps) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-background/65">
      <ChatContainerRoot className="h-full px-4 py-4">
        <ChatContainerContent className="mx-auto flex w-full max-w-3xl gap-4 pb-16">
          {messages.map((message) =>
            message.role === "assistant" ? (
              <div key={message.id} className="space-y-2">
                <Message>
                  <MessageAvatar src="" alt="JusticePath" fallback="J" />
                  <div className="space-y-2">
                    <MessageContent
                      markdown
                      className="max-w-2xl rounded-2xl bg-secondary px-4 py-3 text-sm leading-6 shadow-none [&_ol]:pl-5 [&_ul]:pl-5"
                    >
                      {message.body}
                    </MessageContent>
                    {message.sources?.length ? (
                      <div className="flex flex-wrap gap-2 pl-1">
                        {message.sources.map((source) => (
                          <Source key={source.href} href={source.href}>
                            <SourceTrigger
                              label={source.label}
                              className="h-6 rounded-full border border-border bg-background px-2"
                            />
                            <SourceContent
                              title={source.title}
                              description={source.description}
                            />
                          </Source>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Message>
              </div>
            ) : (
              <div key={message.id} className="ml-auto max-w-2xl">
                <Message className="justify-end">
                  <MessageContent className="rounded-2xl bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground">
                    {message.body}
                  </MessageContent>
                </Message>
              </div>
            )
          )}

          {loading ? (
            <div className="rounded-2xl bg-secondary px-4 py-3 text-sm">
              <TextShimmer>thinking</TextShimmer>
            </div>
          ) : null}

          <ChatContainerScrollAnchor />
          <div className="pointer-events-none sticky bottom-0 flex justify-center pb-1">
            <div className="pointer-events-auto">
              <ScrollButton className="border-border bg-background" />
            </div>
          </div>
        </ChatContainerContent>
      </ChatContainerRoot>
    </div>
  )
}
