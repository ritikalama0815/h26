"use client"

import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from "react"
import { createClient } from "@/lib/supabase/client"
import { Check, Circle, Clock, Sparkles, ChevronDown } from "lucide-react"
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
  pending: "TO DO",
  in_progress: "IN PROGRESS",
  done: "DONE",
}

const STATUS_COLORS: Record<string, CSSProperties> = {
  pending: { fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(194,251,239,0.35)", background: "rgba(255,255,255,0.04)", padding: "1px 6px" },
  in_progress: { fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.1em", color: "#f59e0b", background: "rgba(245,158,11,0.08)", padding: "1px 6px" },
  done: { fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.1em", color: "#00a38b", background: "rgba(0,163,139,0.08)", padding: "1px 6px" },
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
              return sortMine([...prev, t])
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
              return sortMine(next)
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
      <div className="flex flex-col items-center justify-center px-4 py-14 text-center" style={{ border: "1px dashed rgba(0,163,139,0.1)" }}>
        <p style={{ fontSize: "0.92rem", fontWeight: 800, color: "#e8faf5" }}>You&apos;re all clear</p>
        <p style={{ fontSize: "0.72rem", color: "rgba(194,251,239,0.3)", marginTop: 6, maxWidth: 260, lineHeight: 1.5 }}>
          No tasks assigned to you yet. Confirm an AI plan in chat or ask teammates to assign work.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div style={{ padding: "16px 18px", background: "rgba(0,0,0,0.12)", borderLeft: "3px solid #00a38b" }}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <span style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(194,251,239,0.3)" }}>
              COMPLETION
            </span>
            <p style={{ fontSize: "1.8rem", fontWeight: 900, lineHeight: 1, color: "#e8faf5", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
              {progress}
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "rgba(194,251,239,0.35)" }}>%</span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.68rem", color: "rgba(194,251,239,0.5)" }}>
              <span style={{ fontWeight: 700, color: "#e8faf5" }}>{done}</span> / {total} done
            </span>
            {activeCount > 0 && (
              <p style={{ fontSize: "0.62rem", color: "#00a38b", marginTop: 2 }}>{activeCount} active</p>
            )}
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div
            className="h-full transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #00a38b, #6b9e83)" }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0">
        {(
          [
            { id: "all" as const, label: "ALL" },
            { id: "active" as const, label: "ACTIVE" },
            { id: "done" as const, label: "DONE" },
          ]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className="flex-1 py-2 transition-all"
            style={filter === tab.id ? {
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
              color: "#e8faf5", background: "rgba(0,163,139,0.12)",
              boxShadow: "inset 0 -2px 0 #00a38b",
            } : {
              fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.1em",
              color: "rgba(194,251,239,0.3)", background: "transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: "0.78rem", color: "rgba(194,251,239,0.35)" }}>Nothing in this view.</p>
          <p style={{ fontSize: "0.65rem", color: "rgba(194,251,239,0.2)", marginTop: 4 }}>Try switching the filter above.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {byPhase.map(({ phase, items }) => (
            <div key={phase}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <div style={{ width: 3, height: 12, background: "#00a38b" }} />
                <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", color: "rgba(194,251,239,0.4)" }}>
                  {phase.toUpperCase()}
                </span>
                <span style={{ fontSize: "0.56rem", fontWeight: 700, color: "rgba(194,251,239,0.2)", fontVariantNumeric: "tabular-nums" }}>
                  {items.length}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {items.map((todo) => {
                  const StatusIcon = STATUS_ICON[todo.status]
                  const accent = todo.color || "#6b9e83"
                  const desc = todo.description || ""
                  const longDesc = desc.length > 280
                  const showFull = expandedDesc[todo.id] || !longDesc

                  return (
                    <div
                      key={todo.id}
                      className={cn(todo.status === "done" && "opacity-60")}
                      style={{ borderLeft: `3px solid ${accent}`, background: "rgba(0,0,0,0.1)", padding: "12px 14px" }}
                    >
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleStatus(todo)}
                          title={`${STATUS_LABEL[todo.status]} — click to update`}
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center transition-colors"
                          style={todo.status === "done"
                            ? { color: "#00a38b" }
                            : todo.status === "in_progress"
                              ? { color: "#f59e0b" }
                              : { color: "rgba(194,251,239,0.2)" }
                          }
                        >
                          <StatusIcon className="h-4 w-4" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span style={STATUS_COLORS[todo.status]}>
                              {STATUS_LABEL[todo.status]}
                            </span>
                            {todo.ai_generated && (
                              <span
                                className="inline-flex items-center gap-0.5"
                                style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.08em", color: "#c2fbef", background: "rgba(107,158,131,0.15)", padding: "1px 4px" }}
                              >
                                <Sparkles className="h-2 w-2" />
                                AI
                              </span>
                            )}
                          </div>
                          <p
                            style={todo.status === "done"
                              ? { fontSize: "0.85rem", fontWeight: 600, color: "rgba(194,251,239,0.3)", textDecoration: "line-through", lineHeight: 1.4 }
                              : { fontSize: "0.85rem", fontWeight: 600, color: "#e8faf5", lineHeight: 1.4 }
                            }
                          >
                            {todo.title}
                          </p>
                          {desc && (
                            <div className="mt-1.5">
                              <p
                                className={cn(!showFull && "line-clamp-4")}
                                style={{ fontSize: "0.72rem", color: "rgba(194,251,239,0.35)", lineHeight: 1.6, whiteSpace: "pre-line" }}
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
                                  className="mt-1.5 inline-flex items-center gap-1"
                                  style={{ fontSize: "0.65rem", fontWeight: 700, color: "#00a38b", background: "none", border: "none", cursor: "pointer" }}
                                >
                                  {showFull ? "Show less" : "Read full instructions"}
                                  <ChevronDown
                                    className={cn(
                                      "h-3 w-3 transition-transform",
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
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {portalHref && (
        <p className="pt-3 text-center" style={{ borderTop: "1px solid rgba(0,163,139,0.06)", fontSize: "0.65rem", color: "rgba(194,251,239,0.25)" }}>
          Team-wide list & edits in{" "}
          <a href={portalHref} style={{ fontWeight: 700, color: "#00a38b" }}>
            Portal
          </a>
        </p>
      )}
    </div>
  )
}
