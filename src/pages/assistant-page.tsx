import { ChatWorkspace } from "@/components/chat/chat-workspace"
import { AppShell } from "@/components/layout/app-shell"

export function AssistantPage() {
  return (
    <AppShell title="Assistant">
      <ChatWorkspace />
    </AppShell>
  )
}
