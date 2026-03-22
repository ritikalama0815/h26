"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Check, Circle, Clock, ListTodo, Sparkles, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

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

const STATUS_CYCLE: Record<string, "pending" | "in_progress" | "done"> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
}

const STATUS_ICON = {
  pending: Circle,
  in_progress: Clock,
  done: Check,
}

const STATUS_LABEL: Record<string, string> = {
  pending: "To do",
  in_progress: "In progress",
  done: "Done",
}

function sortMine(list: TodoRow[]) {
  return [...list].sort((a, b) => {
    const pa = (a.phase || "").localeCompare(b.phase || "")
    if (pa !== 0) return pa
    return a.priority - b.priority
  })
}

interface WorkspaceMyTodosProps {
  groupId: string
  userId: string
  initialTodos: TodoRow[]
  portalHref?: string
}

type Filter = "all" | "active" | "done"

export function WorkspaceMyTodos({ groupId, userId, initialTodos, portalHref }: WorkspaceMyTodosProps) {
  const mine = sortMine(
    (initialTodos || []).filter((t) => t.assigned_to === userId)
  )
  const [todos, setTodos] = useState<TodoRow[]>(mine)
  const [filter, setFilter] = useState<Filter>("active")
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({})
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    setTodos(
      sortMine((initialTodos || []).filter((t) => t.assigned_to === userId))
    )
  }, [initialTodos, userId])

  useEffect(() => {
    const supabase = supabaseRef.current
    const channel = supabase
      .channel(`workspace-todos-${groupId}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "todos",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const t = payload.new as TodoRow
            if (t.assigned_to !== userId) return
            setTodos((prev) => {
              if (prev.some((x) => x.id === t.id)) return prev
              return [...prev, t].sort((a, b) => {
                const pa = (a.phase || "").localeCompare(b.phase || "")
                if (pa !== 0) return pa
                return a.priority - b.priority
              })
            })
          } else if (payload.eventType === "UPDATE") {
            const t = payload.new as TodoRow
            if (t.assigned_to !== userId) {
              setTodos((prev) => prev.filter((x) => x.id !== t.id))
              return
            }
            setTodos((prev) => {
              const exists = prev.some((x) => x.id === t.id)
              const next = exists
                ? prev.map((x) => (x.id === t.id ? t : x))
                : [...prev, t]
              return next.sort((a, b) => {
                const pa = (a.phase || "").localeCompare(b.phase || "")
                if (pa !== 0) return pa
                return a.priority - b.priority
              })
            })
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string }
            setTodos((prev) => prev.filter((t) => t.id !== old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, userId])

  const toggleStatus = useCallback(async (todo: TodoRow) => {
    const nextStatus = STATUS_CYCLE[todo.status]
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, status: nextStatus } : t))
    )
    await supabaseRef.current
      .from("todos")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", todo.id)
  }, [])

  const filtered = useMemo(() => {
    if (filter === "active") return todos.filter((t) => t.status !== "done")
    if (filter === "done") return todos.filter((t) => t.status === "done")
    return todos
  }, [todos, filter])

  const byPhase = useMemo(() => {
    const phases = Array.from(new Set(filtered.map((t) => t.phase || "General")))
    return phases.map((phase) => ({
      phase,
      items: filtered
        .filter((t) => (t.phase || "General") === phase)
        .sort((a, b) => a.priority - b.priority),
    }))
  }, [filtered])

  const done = todos.filter((t) => t.status === "done").length
  const total = todos.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  const activeCount = todos.filter((t) => t.status !== "done").length

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/10 px-4 py-14 text-center">
        <div className="rounded-3xl bg-linear-to-br from-violet-500/15 to-primary/10 p-5 ring-1 ring-violet-500/20">
          <ListTodo className="h-10 w-10 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="mt-5 text-base font-semibold tracking-tight text-foreground">You&apos;re all clear</h3>
        <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          No tasks assigned to you yet. Confirm an AI plan in chat or ask teammates to assign work.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Progress card */}
      <div className="rounded-2xl border border-border/40 bg-muted/15 p-4 ring-1 ring-border/20">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Completion
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {progress}
              <span className="text-lg font-semibold text-muted-foreground">%</span>
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{done}</span> / {total} done
            {activeCount > 0 && (
              <>
                <br />
                <span className="text-primary">{activeCount} active</span>
              </>
            )}
          </div>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-background/80 ring-1 ring-border/40">
          <div
            className="h-full rounded-full bg-linear-to-r from-violet-500 via-primary to-primary/80 transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Segmented filter */}
      <div className="flex rounded-2xl bg-muted/60 p-1 ring-1 ring-border/30 dark:bg-muted/30">
        {(
          [
            { id: "all" as const, label: "All" },
            { id: "active" as const, label: "Active" },
            { id: "done" as const, label: "Done" },
          ]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all",
              filter === tab.id
                ? "bg-background text-foreground shadow-md shadow-black/5 ring-1 ring-border/40 dark:shadow-black/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-muted/10 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">Nothing in this view.</p>
          <p className="mt-1 text-xs text-muted-foreground/80">Try switching the filter above.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {byPhase.map(({ phase, items }) => (
            <div key={phase}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {phase}
                </h4>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold tabular-nums text-foreground/70">
                  {items.length}
                </span>
              </div>
              <ul className="space-y-3">
                {items.map((todo) => {
                  const StatusIcon = STATUS_ICON[todo.status]
                  const accent = todo.color || "#6366f1"
                  const desc = todo.description || ""
                  const longDesc = desc.length > 280
                  const showFull = expandedDesc[todo.id] || !longDesc

                  return (
                    <li
                      key={todo.id}
                      className={cn(
                        "relative overflow-hidden rounded-2xl border border-border/35 bg-linear-to-br from-card to-muted/20 shadow-sm transition-all",
                        "hover:border-border/60 hover:shadow-md",
                        todo.status === "done" && "opacity-[0.92]"
                      )}
                    >
                      <div
                        className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                        style={{
                          background: `linear-gradient(180deg, ${accent}, ${accent}99)`,
                        }}
                        aria-hidden
                      />
                      <div className="relative pl-5 pr-4 py-4 sm:pl-6">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => toggleStatus(todo)}
                            title={`${STATUS_LABEL[todo.status]} — click to update`}
                            className={cn(
                              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all active:scale-95",
                              todo.status === "done"
                                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-600 shadow-sm dark:text-emerald-400"
                                : todo.status === "in_progress"
                                  ? "border-amber-400/60 bg-amber-500/15 text-amber-600 shadow-sm dark:text-amber-400"
                                  : "border-border/80 bg-background text-muted-foreground hover:border-primary/35 hover:text-primary"
                            )}
                          >
                            <StatusIcon className="h-[18px] w-[18px]" />
                          </button>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                  todo.status === "done"
                                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                                    : todo.status === "in_progress"
                                      ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                                      : "border-border/50 bg-muted/40 text-muted-foreground"
                                )}
                              >
                                {STATUS_LABEL[todo.status]}
                              </span>
                              {todo.ai_generated && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-violet-500/12 px-2 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-500/25 dark:text-violet-300">
                                  <Sparkles className="h-3 w-3" />
                                  AI
                                </span>
                              )}
                            </div>
                            <p
                              className={cn(
                                "mt-2 text-[15px] font-semibold leading-snug tracking-tight",
                                todo.status === "done" &&
                                  "text-muted-foreground line-through decoration-muted-foreground/40"
                              )}
                            >
                              {todo.title}
                            </p>
                            {desc && (
                              <div className="mt-2">
                                <p
                                  className={cn(
                                    "text-[13px] leading-relaxed text-muted-foreground whitespace-pre-line",
                                    !showFull && "line-clamp-4"
                                  )}
                                >
                                  {desc}
                                </p>
                                {longDesc && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedDesc((p) => ({
                                        ...p,
                                        [todo.id]: !p[todo.id],
                                      }))
                                    }
                                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                                  >
                                    {showFull ? "Show less" : "Read full instructions"}
                                    <ChevronDown
                                      className={cn(
                                        "h-3.5 w-3.5 transition-transform",
                                        showFull && "rotate-180"
                                      )}
                                    />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {portalHref && (
        <p className="border-t border-border/30 pt-4 text-center text-[11px] text-muted-foreground">
          Team-wide list & edits in{" "}
          <a
            href={portalHref}
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            Portal
          </a>
        </p>
      )}
    </div>
  )
}
