"use client"

import { useState } from "react"
import { GroupChat } from "./group-chat"
import { ResourcePanel } from "./resource-panel"
import { TodoPanel } from "./todo-panel"
import { MessageCircle, ChevronRight, ChevronLeft } from "lucide-react"

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { full_name: string | null } | null
}

interface Resource {
  id: string
  title: string
  url: string
  resource_type: string
  created_at: string
  profiles: { full_name: string | null } | null
}

interface Todo {
  id: string
  group_id: string
  title: string
  description: string | null
  assigned_to: string | null
  phase: string | null
  priority: number
  status: "pending" | "in_progress" | "done"
  color: string | null
  created_by: string | null
  ai_generated: boolean
  created_at: string
  updated_at: string
}

interface GroupPortalProps {
  groupId: string
  groupName: string
  projectName: string
  /** Project creator — used to verify instructor reply messages in chat */
  projectOwnerId: string
  userId: string
  initialResources: Resource[]
  initialMessages: Message[]
  initialTodos: Todo[]
  members: Array<{ userId: string; fullName: string; email: string | null }>
}

const CHAT_OPEN = 380
const CHAT_CLOSED = 44
const TODO_WIDTH = 320

export function GroupPortal({
  groupId,
  groupName,
  projectName,
  projectOwnerId,
  userId,
  initialResources,
  initialMessages,
  initialTodos,
  members,
}: GroupPortalProps) {
  const [chatOpen, setChatOpen] = useState(true)
  const [hovered, setHovered] = useState(false)
  const showChat = chatOpen || hovered

  return (
    <div className="flex h-full gap-3">
      {/* Resources — flexible width */}
      <div className="flex-1 min-w-0 overflow-y-auto rounded-lg border border-[rgba(0,163,139,0.08)] bg-[rgba(17,17,22,0.4)] backdrop-blur-sm p-5">
        <ResourcePanel
          groupId={groupId}
          groupName={groupName}
          projectName={projectName}
          userId={userId}
          initialResources={initialResources}
          memberEmails={members.filter((m) => m.email).map((m) => m.email!)}
        />
      </div>

      {/* Todo Panel — fixed width */}
      <div
        className="shrink-0 flex flex-col rounded-lg border border-[rgba(0,163,139,0.08)] bg-[rgba(17,17,22,0.5)] backdrop-blur-sm overflow-hidden"
        style={{ width: TODO_WIDTH }}
      >
        <TodoPanel
          groupId={groupId}
          userId={userId}
          initialTodos={initialTodos}
          members={members}
        />
      </div>

      {/* Chat — collapsible */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="shrink-0 flex flex-col rounded-lg border border-[rgba(0,163,139,0.08)] bg-[rgba(17,17,22,0.5)] backdrop-blur-sm overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{ width: showChat ? CHAT_OPEN : CHAT_CLOSED }}
      >
        {/* Header */}
        <div className="flex h-11 items-center px-3 shrink-0 gap-2" style={{ borderBottom: "1px solid rgba(0,163,139,0.08)" }}>
          {showChat ? (
            <>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center" style={{ background: "rgba(0,163,139,0.08)", border: "1px solid rgba(0,163,139,0.15)" }}>
                <MessageCircle className="h-3 w-3" style={{ color: "#00a38b" }} />
              </div>
              <span className="truncate flex-1" style={{ fontSize: "0.78rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em" }}>Chat</span>
              <span style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.12em", color: "rgba(194,251,239,0.3)" }}>
                {members.length}
              </span>
              <button
                onClick={() => setChatOpen(false)}
                className="ml-1 p-1 transition-colors hover:bg-white/5 shrink-0"
              >
                <ChevronRight className="h-3.5 w-3.5" style={{ color: "rgba(194,251,239,0.3)" }} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setChatOpen(true)}
              className="flex w-full items-center justify-center transition-colors"
            >
              <MessageCircle className="h-4 w-4" style={{ color: "rgba(194,251,239,0.3)" }} />
            </button>
          )}
        </div>

        {showChat ? (
          <div className="flex-1 min-h-0">
            <GroupChat
              groupId={groupId}
              projectOwnerId={projectOwnerId}
              userId={userId}
              initialMessages={initialMessages}
              members={members}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <button
              onClick={() => setChatOpen(true)}
              className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span
                className="text-[10px] font-medium tracking-wider uppercase"
                style={{ writingMode: "vertical-rl" }}
              >
                Chat
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
