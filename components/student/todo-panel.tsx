"use client"

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type CSSProperties,
} from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ListTodo,
  Plus,
  Check,
  Circle,
  Clock,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  ChevronsDownUp,
  ChevronsUpDown,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

interface TodoPanelProps {
  groupId: string
  userId: string
  initialTodos: Todo[]
  members: Array<{ userId: string; fullName: string }>
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

const STATUS_LABEL = {
  pending: "To do",
  in_progress: "In progress",
  done: "Done",
}

const STATUS_STYLE: Record<string, CSSProperties> = {
  pending: { fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(194,251,239,0.35)", background: "rgba(255,255,255,0.04)", padding: "1px 6px" },
  in_progress: { fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.1em", color: "#f59e0b", background: "rgba(245,158,11,0.08)", padding: "1px 6px" },
  done: { fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.1em", color: "#00a38b", background: "rgba(0,163,139,0.08)", padding: "1px 6px" },
}

/** Saturated, spaced hues — read clearly on light/dark backgrounds */
const MEMBER_COLORS = [
  "#4f46e5", // indigo
  "#d97706", // amber
  "#059669", // emerald
  "#dc2626", // red
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#ea580c", // orange
  "#db2777", // pink
]

const NONE = "__none__"
const UNASSIGNED_ACCENT = "#64748b" // slate-500 — neutral when no assignee

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim().replace("#", "")
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("")
  }
  if (h.length !== 6) return null
  const r = Number.parseInt(h.slice(0, 2), 16)
  const g = Number.parseInt(h.slice(2, 4), 16)
  const b = Number.parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b }
}

/** Tint backgrounds / borders from member color without theme washing it out */
function rgbaFromHex(hex: string, alpha: number) {
  const rgb = parseHex(hex)
  if (!rgb) return `rgba(100, 116, 139, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean)
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase()
  if (p.length === 1 && p[0].length >= 2) return p[0].slice(0, 2).toUpperCase()
  return p[0]?.[0]?.toUpperCase() || "?"
}

type FilterTab = "all" | "mine" | "active" | "done"

export function TodoPanel({ groupId, userId, initialTodos, members }: TodoPanelProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos || [])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newAssignee, setNewAssignee] = useState("")
  const [filter, setFilter] = useState<FilterTab>("all")
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Todo | null>(null)
  const supabaseRef = useRef(createClient())

  const memberColorMap = useRef<Record<string, string>>({})
  useEffect(() => {
    const map: Record<string, string> = {}
    members.forEach((m, i) => {
      map[m.userId] = MEMBER_COLORS[i % MEMBER_COLORS.length]
    })
    memberColorMap.current = map
  }, [members])

  const memberNameMap = useRef<Record<string, string>>({})
  useEffect(() => {
    const map: Record<string, string> = {}
    for (const m of members) map[m.userId] = m.fullName
    memberNameMap.current = map
  }, [members])

  useEffect(() => {
    const supabase = supabaseRef.current
    const channel = supabase
      .channel(`todos-${groupId}`)
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
            const newTodo = payload.new as Todo
            setTodos((prev) => {
              if (prev.some((t) => t.id === newTodo.id)) return prev
              return [...prev, newTodo]
            })
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Todo
            setTodos((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            )
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
  }, [groupId])

  const toggleStatus = useCallback(async (todo: Todo) => {
    const nextStatus = STATUS_CYCLE[todo.status]
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, status: nextStatus } : t))
    )
    await supabaseRef.current
      .from("todos")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", todo.id)
  }, [])

  const deleteTodo = useCallback(async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    await supabaseRef.current.from("todos").delete().eq("id", id)
  }, [])

  const reassign = useCallback(async (todoId: string, newUserId: string) => {
    const color = newUserId
      ? memberColorMap.current[newUserId] || MEMBER_COLORS[0]
      : null
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId ? { ...t, assigned_to: newUserId || null, color } : t
      )
    )
    await supabaseRef.current
      .from("todos")
      .update({
        assigned_to: newUserId || null,
        color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", todoId)
  }, [])

  const addTodo = useCallback(async () => {
    if (!newTitle.trim()) return
    const color = newAssignee
      ? memberColorMap.current[newAssignee] || MEMBER_COLORS[0]
      : MEMBER_COLORS[0]

    const { data, error } = await supabaseRef.current
      .from("todos")
      .insert({
        group_id: groupId,
        title: newTitle.trim(),
        assigned_to: newAssignee || null,
        status: "pending",
        color,
        created_by: userId,
        ai_generated: false,
        priority: 0,
      })
      .select()
      .single()

    if (!error && data) {
      setTodos((prev) => [...prev, data])
      setNewTitle("")
      setNewAssignee("")
      setShowAdd(false)
    }
  }, [groupId, userId, newTitle, newAssignee])

  const togglePhase = (phase: string) => {
    setCollapsed((prev) => ({ ...prev, [phase]: !prev[phase] }))
  }

  const safeTodos = todos || []
  const q = search.trim().toLowerCase()

  const filteredByTab = useMemo(() => {
    let list = safeTodos
    if (filter === "mine") {
      list = list.filter((t) => t.assigned_to === userId)
    } else if (filter === "active") {
      list = list.filter((t) => t.status !== "done")
    } else if (filter === "done") {
      list = list.filter((t) => t.status === "done")
    }
    if (q) {
      list = list.filter((t) => {
        const title = t.title.toLowerCase()
        const desc = (t.description || "").toLowerCase()
        return title.includes(q) || desc.includes(q)
      })
    }
    return list
  }, [safeTodos, filter, userId, q])

  const phases = Array.from(
    new Set(filteredByTab.map((t) => t.phase || "General"))
  )
  const grouped = phases.map((phase) => ({
    phase,
    items: filteredByTab
      .filter((t) => (t.phase || "General") === phase)
      .sort((a, b) => a.priority - b.priority),
  }))

  const doneCount = safeTodos.filter((t) => t.status === "done").length
  const totalCount = safeTodos.length
  const progress =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const expandAll = () => setCollapsed({})
  const collapseAll = () => {
    const next: Record<string, boolean> = {}
    for (const p of phases) next[p] = true
    setCollapsed(next)
  }

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "mine", label: "Mine" },
    { id: "active", label: "Active" },
    { id: "done", label: "Done" },
  ]

  return (
    <div
      className="todo-panel-scope flex h-full min-h-0 flex-col text-foreground"
      style={{ background: "transparent" }}
      data-todo-panel
    >
      {/* Header */}
      <div className="shrink-0 px-3 pb-3 pt-3" style={{ borderBottom: "1px solid rgba(0,163,139,0.08)" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center" style={{ background: "rgba(0,163,139,0.08)", border: "1px solid rgba(0,163,139,0.15)" }}>
                <ListTodo className="h-3.5 w-3.5" style={{ color: "#00a38b" }} />
              </div>
              <div className="min-w-0">
                <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em", lineHeight: 1 }}>
                  Tasks
                </h3>
                <p style={{ fontSize: "0.6rem", color: "rgba(194,251,239,0.35)", marginTop: 2 }}>
                  {totalCount === 0
                    ? "Add or generate with @AI"
                    : `${doneCount} of ${totalCount} complete`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              title="Expand all"
              onClick={expandAll}
              className="flex h-6 w-6 items-center justify-center transition-colors hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <ChevronsDownUp className="h-3 w-3" style={{ color: "rgba(194,251,239,0.3)" }} />
            </button>
            <button
              type="button"
              title="Collapse all"
              onClick={collapseAll}
              className="flex h-6 w-6 items-center justify-center transition-colors hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <ChevronsUpDown className="h-3 w-3" style={{ color: "rgba(194,251,239,0.3)" }} />
            </button>
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="flex h-6 items-center gap-1 px-2 transition-colors hover:brightness-110"
              style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", color: "#0a0a0f", background: "#00a38b" }}
            >
              <Plus className="h-3 w-3" />
              ADD
            </button>
          </div>
        </div>

        {/* Progress */}
        {totalCount > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(194,251,239,0.3)" }}>PROGRESS</span>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#e8faf5", fontVariantNumeric: "tabular-nums" }}>
                {progress}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div
                className="h-full transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #00a38b, #6b9e83)" }}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mt-3 flex gap-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className="flex-1 py-1.5 transition-all"
              style={filter === tab.id ? {
                fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em",
                color: "#e8faf5", background: "rgba(0,163,139,0.12)",
                boxShadow: "inset 0 -2px 0 #00a38b",
              } : {
                fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.1em",
                color: "rgba(194,251,239,0.3)", background: "transparent",
              }}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="shrink-0 px-3 py-3" style={{ borderBottom: "1px solid rgba(0,163,139,0.08)", background: "rgba(0,163,139,0.03)" }}>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.14em", color: "rgba(194,251,239,0.4)" }}>
                TITLE
              </Label>
              <Input
                placeholder="What needs to be done?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-9 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTodo()
                  if (e.key === "Escape") setShowAdd(false)
                }}
              />
            </div>
            <div className="space-y-1">
              <Label style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.14em", color: "rgba(194,251,239,0.4)" }}>
                ASSIGNEE
              </Label>
              <Select
                value={newAssignee || NONE}
                onValueChange={(v) => setNewAssignee(v === NONE ? "" : v)}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-0.5">
              <Button
                type="button"
                size="sm"
                className="h-8 flex-1 text-xs"
                onClick={addTodo}
                disabled={!newTitle.trim()}
              >
                Add task
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => {
                  setShowAdd(false)
                  setNewTitle("")
                  setNewAssignee("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Todo list */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3 pb-4">
          {totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center" style={{ border: "1px dashed rgba(0,163,139,0.1)" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "#e8faf5" }}>
                No tasks yet
              </p>
              <p style={{ fontSize: "0.68rem", color: "rgba(194,251,239,0.3)", marginTop: 4, maxWidth: 200, lineHeight: 1.5 }}>
                Type{" "}
                <code style={{ fontSize: "0.62rem", fontFamily: "var(--font-mono)", background: "rgba(0,163,139,0.08)", padding: "1px 5px", color: "#00a38b" }}>@AI</code>{" "}
                in chat to generate a plan, or tap Add.
              </p>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="mt-4 flex items-center gap-1 transition-colors hover:brightness-110"
                style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", color: "#0a0a0f", background: "#00a38b", padding: "5px 12px" }}
              >
                <Plus className="h-3 w-3" />
                NEW TASK
              </button>
            </div>
          ) : filteredByTab.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center" style={{ border: "1px dashed rgba(255,255,255,0.06)" }}>
              <Search className="h-5 w-5" style={{ color: "rgba(194,251,239,0.15)" }} />
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(194,251,239,0.35)", marginTop: 8 }}>
                No matches
              </p>
              <button
                type="button"
                onClick={() => { setSearch(""); setFilter("all") }}
                style={{ fontSize: "0.62rem", fontWeight: 700, color: "#00a38b", marginTop: 6, background: "none", border: "none", cursor: "pointer" }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped.map(({ phase, items }) => (
                <div key={phase}>
                  {/* Phase header */}
                  <button
                    type="button"
                    onClick={() => togglePhase(phase)}
                    className="flex w-full items-center gap-2 px-1 py-2 text-left transition-colors hover:bg-white/3"
                  >
                    {collapsed[phase] ? (
                      <ChevronRight className="h-3 w-3 shrink-0" style={{ color: "rgba(194,251,239,0.25)" }} />
                    ) : (
                      <ChevronDown className="h-3 w-3 shrink-0" style={{ color: "rgba(194,251,239,0.25)" }} />
                    )}
                    <span className="min-w-0 flex-1 truncate" style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", color: "rgba(194,251,239,0.5)" }}>
                      {phase.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(194,251,239,0.25)", fontVariantNumeric: "tabular-nums" }}>
                      {items.filter((t) => t.status === "done").length}/{items.length}
                    </span>
                  </button>

                  {!collapsed[phase] && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {items.map((todo) => {
                        const StatusIcon = STATUS_ICON[todo.status]
                        const assigneeName = todo.assigned_to
                          ? memberNameMap.current[todo.assigned_to] || "?"
                          : null
                        const accent =
                          todo.color ||
                          (todo.assigned_to
                            ? memberColorMap.current[todo.assigned_to] ||
                              MEMBER_COLORS[0]
                            : UNASSIGNED_ACCENT)

                        return (
                          <div
                            key={todo.id}
                            className={cn(
                              "group/item px-2.5 py-2 transition-colors hover:bg-white/3",
                              todo.status === "done" && "opacity-60"
                            )}
                            style={{ borderLeft: `3px solid ${accent}`, background: "rgba(0,0,0,0.1)" }}
                          >
                            <div className="flex gap-2">
                              {/* Status toggle */}
                              <button
                                type="button"
                                onClick={() => toggleStatus(todo)}
                                title={`${STATUS_LABEL[todo.status]} — click to advance`}
                                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center transition-colors"
                                style={todo.status === "done"
                                  ? { color: "#00a38b" }
                                  : todo.status === "in_progress"
                                    ? { color: "#f59e0b" }
                                    : { color: "rgba(194,251,239,0.2)" }
                                }
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-1">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <p
                                        style={todo.status === "done"
                                          ? { fontSize: "0.75rem", fontWeight: 600, color: "rgba(194,251,239,0.3)", textDecoration: "line-through", lineHeight: 1.4 }
                                          : { fontSize: "0.75rem", fontWeight: 600, color: "#e8faf5", lineHeight: 1.4 }
                                        }
                                      >
                                        {todo.title}
                                      </p>
                                      {todo.ai_generated && (
                                        <span
                                          className="inline-flex items-center gap-0.5"
                                          style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.08em", color: "#c2fbef", background: "rgba(107,158,131,0.15)", padding: "1px 4px" }}
                                          title="AI generated"
                                        >
                                          <Sparkles className="h-2 w-2" />
                                          AI
                                        </span>
                                      )}
                                    </div>
                                    {todo.description && (
                                      <p className="mt-0.5 max-h-20 overflow-y-auto whitespace-pre-line" style={{ fontSize: "0.62rem", color: "rgba(194,251,239,0.3)", lineHeight: 1.5 }}>
                                        {todo.description}
                                      </p>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    className="h-5 w-5 shrink-0 flex items-center justify-center opacity-0 transition-opacity group-hover/item:opacity-100"
                                    title="Delete task"
                                    onClick={() => setDeleteTarget(todo)}
                                    style={{ color: "rgba(239,68,68,0.5)" }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>

                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  <span style={STATUS_STYLE[todo.status]}>
                                    {STATUS_LABEL[todo.status].toUpperCase()}
                                  </span>

                                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                    {assigneeName ? (
                                      <div
                                        className="flex h-5 w-5 shrink-0 items-center justify-center"
                                        style={{ fontSize: "0.5rem", fontWeight: 800, color: accent, background: rgbaFromHex(accent, 0.15) }}
                                        title={assigneeName}
                                      >
                                        {initials(assigneeName)}
                                      </div>
                                    ) : (
                                      <div
                                        className="flex h-5 w-5 shrink-0 items-center justify-center"
                                        style={{ border: "1px dashed rgba(255,255,255,0.1)" }}
                                        title="Unassigned"
                                      >
                                        <User className="h-2.5 w-2.5" style={{ color: "rgba(194,251,239,0.2)" }} />
                                      </div>
                                    )}
                                    <Select
                                      value={todo.assigned_to || NONE}
                                      onValueChange={(v) =>
                                        reassign(
                                          todo.id,
                                          v === NONE ? "" : v
                                        )
                                      }
                                    >
                                      <SelectTrigger
                                        className="h-6 min-w-0 flex-1 text-[10px] font-medium shadow-none [&_svg]:h-2.5 [&_svg]:w-2.5"
                                        style={{
                                          borderColor: rgbaFromHex(accent, 0.2),
                                          backgroundColor: "transparent",
                                          color: assigneeName ? accent : "rgba(194,251,239,0.3)",
                                          fontSize: "0.62rem",
                                        }}
                                      >
                                        <SelectValue
                                          placeholder="Assign"
                                          className="truncate"
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={NONE}>
                                          Unassigned
                                        </SelectItem>
                                        {members.map((m) => (
                                          <SelectItem
                                            key={m.userId}
                                            value={m.userId}
                                          >
                                            <span className="flex items-center gap-2">
                                              <span
                                                className="h-1.5 w-1.5 shrink-0"
                                                style={{
                                                  backgroundColor:
                                                    memberColorMap.current[
                                                      m.userId
                                                    ] || MEMBER_COLORS[0],
                                                }}
                                              />
                                              {m.fullName}
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.title.slice(0, 80)}${deleteTarget.title.length > 80 ? "…" : ""}" will be removed for everyone in the group.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) void deleteTodo(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
