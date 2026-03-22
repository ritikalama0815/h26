"use client"

import Link from "next/link"
import { ResourceThumbnailGrid, type ResourceThumbnailItem } from "./resource-thumbnail-grid"
import { WorkspaceMyTodos } from "./workspace-my-todos"
import { ArrowUpRight, Sparkles } from "lucide-react"

interface TodoRow {
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

interface GroupWorkspaceProps {
  groupId: string
  userId: string
  groupName: string
  projectName: string
  resources: ResourceThumbnailItem[]
  todos: TodoRow[]
  memberEmails: string[]
}

export function GroupWorkspace({
  groupId,
  userId,
  groupName,
  projectName,
  resources,
  todos,
  memberEmails,
}: GroupWorkspaceProps) {
  const portalHref = `/dashboard/student/groups/${groupId}`
  const myCount = todos.filter((t) => t.assigned_to === userId).length

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-5 pb-4">

      {/* Header strip */}
      <header
        className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        style={{ padding: "20px 24px", background: "rgba(17,17,22,0.4)", border: "1px solid rgba(0,163,139,0.08)" }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div style={{ width: 20, height: 2, background: "#00a38b" }} />
            <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.28em", color: "#6b9e83" }}>
              WORKSPACE · {projectName.toUpperCase()}
            </span>
            {myCount > 0 && (
              <span className="inline-flex items-center gap-1" style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", color: "#00a38b", background: "rgba(0,163,139,0.1)", padding: "2px 8px" }}>
                <Sparkles className="h-2.5 w-2.5" />
                {myCount} ASSIGNED
              </span>
            )}
          </div>
          <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.02em", color: "#e8faf5" }}>
            {groupName}
          </h1>
        </div>
        <Link
          href={portalHref}
          className="inline-flex items-center gap-2 shrink-0 transition-all hover:brightness-110"
          style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", color: "#0a0a0f", background: "#00a38b", padding: "8px 18px" }}
        >
          OPEN PORTAL
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      {/* Main grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">

        {/* Resources */}
        <section className="flex min-h-0 flex-col lg:col-span-7">
          <div
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            style={{ background: "rgba(17,17,22,0.4)", border: "1px solid rgba(0,163,139,0.08)" }}
          >
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,163,139,0.06)" }}>
              <div>
                <h2 style={{ fontSize: "0.78rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em" }}>
                  Shared Resources
                </h2>
                <p style={{ fontSize: "0.62rem", color: "rgba(194,251,239,0.3)", marginTop: 2 }}>
                  {resources.length === 0
                    ? "No links yet — add some from Portal"
                    : `${resources.length} link${resources.length === 1 ? "" : "s"}`}
                </p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <ResourceThumbnailGrid
                resources={resources}
                memberEmails={memberEmails}
                portalHref={portalHref}
              />
            </div>
          </div>
        </section>

        {/* Tasks */}
        <section className="flex min-h-[min(70vh,640px)] flex-col lg:col-span-5 lg:min-h-0">
          <div
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            style={{ background: "rgba(17,17,22,0.4)", border: "1px solid rgba(0,163,139,0.08)" }}
          >
            <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,163,139,0.06)" }}>
              <div className="flex items-center gap-2">
                <div style={{ width: 3, height: 14, background: "#00a38b" }} />
                <h2 style={{ fontSize: "0.78rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em" }}>
                  My Tasks
                </h2>
              </div>
              <p style={{ fontSize: "0.62rem", color: "rgba(194,251,239,0.3)", marginTop: 2, marginLeft: 13 }}>
                Your assignments in this group
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
              <WorkspaceMyTodos
                groupId={groupId}
                userId={userId}
                initialTodos={todos}
                portalHref={portalHref}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
