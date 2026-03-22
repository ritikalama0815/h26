"use client"

import Link from "next/link"
import { ResourceThumbnailGrid, type ResourceThumbnailItem } from "./resource-thumbnail-grid"
import { WorkspaceMyTodos } from "./workspace-my-todos"
import { ArrowUpRight, Layers, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-6 pb-4">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute -inset-x-8 -top-4 h-72 opacity-40 blur-3xl"
        aria-hidden
      >
        <div className="absolute left-1/4 top-0 h-48 w-48 rounded-full bg-primary/20" />
        <div className="absolute right-1/4 top-8 h-56 w-56 rounded-full bg-violet-500/15" />
      </div>

      {/* Hero strip */}
      <header className="relative z-10 overflow-hidden rounded-3xl border border-border/50 bg-card/80 shadow-lg shadow-black/5 ring-1 ring-border/30 backdrop-blur-xl dark:bg-card/60 dark:shadow-black/20">
        <div className="absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-violet-500/7" />
        <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-[100px] bg-linear-to-bl from-primary/5 to-transparent" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 text-primary shadow-inner ring-1 ring-primary/20">
              <Layers className="h-7 w-7" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-background/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ring-1 ring-border/50">
                  Workspace
                </span>
                {myCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300">
                    <Sparkles className="h-3 w-3" />
                    {myCount} assigned to you
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {groupName}
              </h1>
              <p className="text-sm text-muted-foreground">{projectName}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
            <p className="max-w-xs text-right text-xs leading-relaxed text-muted-foreground">
              Links and your personal tasks — edit the full group board in Portal.
            </p>
            <Button
              asChild
              size="sm"
              className="h-10 gap-2 rounded-xl px-5 font-semibold shadow-md shadow-primary/15"
            >
              <Link href={portalHref}>
                Open group portal
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Bento-style main */}
      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        {/* Resources — spans 7 */}
        <section className="flex min-h-0 flex-col lg:col-span-7">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/50 shadow-xl shadow-black/3 ring-1 ring-border/20 backdrop-blur-sm dark:bg-card/40 dark:shadow-black/30">
            <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-foreground">
                  Shared resources
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {resources.length === 0
                    ? "No links yet — add some from Portal"
                    : `${resources.length} link${resources.length === 1 ? "" : "s"} · favicon preview`}
                </p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <ResourceThumbnailGrid
                resources={resources}
                memberEmails={memberEmails}
                portalHref={portalHref}
              />
            </div>
          </div>
        </section>

        {/* Tasks — spans 5, sticky feel on large screens */}
        <section className="flex min-h-[min(70vh,640px)] flex-col lg:col-span-5 lg:min-h-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border/40 bg-linear-to-b from-card/90 to-card/50 shadow-xl shadow-black/3 ring-1 ring-violet-500/10 backdrop-blur-sm dark:from-card/70 dark:to-card/30 dark:shadow-black/30">
            <div className="relative border-b border-border/40 bg-linear-to-r from-violet-500/[0.07] to-transparent px-5 py-4 sm:px-6">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-violet-500/50 via-primary/40 to-transparent" />
              <h2 className="text-sm font-bold tracking-tight text-foreground">My tasks</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Your assignments in this group only
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
