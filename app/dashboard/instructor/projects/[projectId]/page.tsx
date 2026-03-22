import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { getCurrentProfile } from "@/lib/auth/profile"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, FolderKanban, ArrowRight,
  Settings, MessageSquareWarning, FileUp
} from "lucide-react"
import Link from "next/link"
import { getGroupColor, groupColorDot } from "@/lib/group-colors"
import { InstructorQuestionCard } from "@/components/instructor/instructor-question-card"

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function ProjectDetailPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = await getCurrentProfile()
  if (profile?.role !== "instructor") redirect("/dashboard/student")

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single()

  if (error || !project || project.created_by !== user?.id) notFound()

  const { data: groups } = await supabase
    .from("project_groups")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order")

  const { data: members } = await supabase
    .from("memberships")
    .select(`
      id, user_id, group_id, role, joined_at,
      profiles ( id, full_name, email, github_username )
    `)
    .eq("project_id", projectId)

  const students = (members || []).filter((m) => m.role === "member")

  const groupIds = (groups || []).map((g) => g.id)

  const { data: questions } = groupIds.length > 0
    ? await supabase
        .from("questions")
        .select("*, profiles!questions_asked_by_fkey ( full_name, email )")
        .in("group_id", groupIds)
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] }

  const { data: submissions } = groupIds.length > 0
    ? await supabase
        .from("submissions")
        .select("*, profiles!submissions_submitted_by_fkey ( full_name, email )")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] }

  const groupNameMap: Record<string, string> = {}
  const groupIndexMap: Record<string, number> = {}
  for (let i = 0; i < (groups || []).length; i++) {
    const g = groups![i]
    groupNameMap[g.id] = g.name
    groupIndexMap[g.id] = i
  }

  return (
    <div className="mx-auto max-w-6xl px-6 sm:px-10 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/instructor">
            <button className="mt-1 flex h-8 w-8 items-center justify-center transition-colors hover:bg-white/5" style={{ border: "1px solid rgba(0,163,139,0.12)" }}>
              <ArrowLeft className="h-3.5 w-3.5" style={{ color: "rgba(194,251,239,0.4)" }} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div style={{ width: 24, height: 2, background: "#00a38b" }} />
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.28em", color: "#6b9e83" }}>
                PROJECT
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.02em", color: "#e8faf5" }}>
              {project.name}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "rgba(194,251,239,0.35)", marginTop: 6 }}>
              {project.description || "No description"}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/instructor/projects/${projectId}/settings`}>
          <Button variant="outline" size="sm" className="gap-2 text-xs font-bold tracking-wide h-8">
            <Settings className="h-3 w-3" /> SETTINGS
          </Button>
        </Link>
      </div>

      {/* Sub-groups */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div style={{ width: 2, height: 18, background: "#00a38b" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.28em", color: "#6b9e83" }}>
            GROUPS
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(groups || []).map((group, gi) => {
            const groupStudents = students.filter((s) => s.group_id === group.id)
            const color = getGroupColor(gi)
            return (
              <Link key={group.id} href={`/dashboard/instructor/projects/${projectId}/groups/${group.id}`}>
                <div
                  className="group relative overflow-hidden transition-all hover:translate-x-0.5"
                  style={{ background: "#0d0d16", border: "1px solid rgba(0,163,139,0.1)", borderLeft: `3px solid ${color.hex}` }}
                >
                  <div style={{ padding: "16px 18px" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em" }}>
                        {group.name}
                      </span>
                      {group.github_repo_url && (
                        <Badge variant="secondary" className="text-[9px]">GIT</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "0.7rem", color: "rgba(194,251,239,0.35)" }}>
                        {groupStudents.length} students
                      </span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" style={{ color: "rgba(194,251,239,0.2)" }} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Student roster */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div style={{ width: 2, height: 18, background: "#6b9e83" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.28em", color: "#6b9e83" }}>
            ROSTER · {students.length} STUDENTS
          </span>
        </div>
        {students.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "rgba(194,251,239,0.35)" }}>No students added yet.</p>
        ) : (
          <div style={{ border: "1px solid rgba(0,163,139,0.08)" }}>
            <div
              className="grid grid-cols-[1fr_1fr_auto] gap-2 px-4 py-2.5"
              style={{ borderBottom: "1px solid rgba(0,163,139,0.08)", background: "rgba(0,163,139,0.03)" }}
            >
              <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(194,251,239,0.3)" }}>STUDENT</span>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(194,251,239,0.3)" }}>GROUP</span>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(194,251,239,0.3)" }}>GITHUB</span>
            </div>
            {students.map((m) => {
              const p = m.profiles as { full_name: string | null; email: string | null; github_username: string | null } | null
              const gIdx = m.group_id ? groupIndexMap[m.group_id] ?? 0 : -1
              const gColor = gIdx >= 0 ? getGroupColor(gIdx) : null
              return (
                <div
                  key={m.id}
                  className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 px-4 py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", borderLeft: gColor ? `3px solid ${gColor.hex}` : undefined }}
                >
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e8faf5" }}>
                      {p?.full_name || p?.email || "Unknown"}
                    </p>
                    <p className="truncate" style={{ fontSize: "0.68rem", color: "rgba(194,251,239,0.3)" }}>{p?.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {gColor && <span style={groupColorDot(gIdx, 7)} />}
                    <span style={{ fontSize: "0.72rem", color: gColor ? gColor.hex : "rgba(194,251,239,0.3)" }}>
                      {m.group_id ? groupNameMap[m.group_id] || "—" : "Unassigned"}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "rgba(194,251,239,0.3)" }}>
                    {p?.github_username || "—"}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Two columns: Questions + Submissions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Open questions */}
        <div style={{ background: "rgba(17,17,22,0.4)", border: "1px solid rgba(0,163,139,0.08)", padding: "24px" }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-7 w-7 items-center justify-center" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <MessageSquareWarning className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em", lineHeight: 1 }}>
                Open Questions
              </h3>
              <p style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.12em", color: "rgba(194,251,239,0.3)", marginTop: 2 }}>
                {questions?.length || 0} PENDING
              </p>
            </div>
          </div>
          {(!questions || questions.length === 0) ? (
            <p style={{ fontSize: "0.82rem", color: "rgba(194,251,239,0.3)" }}>No open questions.</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q: Record<string, unknown>) => (
                <div key={q.id as string}>
                  <div className="mb-2 flex items-center gap-2">
                    <span style={groupColorDot(groupIndexMap[q.group_id as string] ?? 0, 6)} />
                    <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", color: "rgba(194,251,239,0.35)" }}>
                      {groupNameMap[q.group_id as string] || "—"}
                    </span>
                  </div>
                  <InstructorQuestionCard
                    projectId={projectId}
                    question={{
                      id: q.id as string,
                      group_id: q.group_id as string,
                      content: q.content as string,
                      answer: (q.answer as string | null) ?? null,
                      resolved: (q.resolved as boolean | null) ?? null,
                      created_at: q.created_at as string,
                      profiles: q.profiles as { full_name: string | null; email: string | null } | null,
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent submissions */}
<<<<<<< HEAD
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" /> Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!submissions || submissions.length === 0) ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((s: Record<string, unknown>) => (
                  <div key={s.id as string} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{s.title as string}</p>
                    {(s.file_url as string) && (
                      <a href={s.file_url as string} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-primary hover:underline">
                        Download file
                      </a>
                    )}
                    {(s.link_url as string) && (
                      <a href={s.link_url as string} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        {s.link_url as string}
                      </a>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{(s.profiles as Record<string, unknown>)?.full_name as string || (s.profiles as Record<string, unknown>)?.email as string}</span>
                      <span>·</span>
                      <Badge variant="outline" className={`text-[10px] ${(s.group_id as string) in groupIndexMap ? getGroupColor(groupIndexMap[s.group_id as string]).text : ""}`}>
                        <span style={groupColorDot(groupIndexMap[s.group_id as string] ?? 0, 6)} className="mr-1" />
=======
        <div style={{ background: "rgba(17,17,22,0.4)", border: "1px solid rgba(0,163,139,0.08)", padding: "24px" }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-7 w-7 items-center justify-center" style={{ background: "rgba(0,163,139,0.08)", border: "1px solid rgba(0,163,139,0.15)" }}>
              <FileUp className="h-3.5 w-3.5" style={{ color: "#00a38b" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em", lineHeight: 1 }}>
                Recent Submissions
              </h3>
              <p style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.12em", color: "rgba(194,251,239,0.3)", marginTop: 2 }}>
                {submissions?.length || 0} TOTAL
              </p>
            </div>
          </div>
          {(!submissions || submissions.length === 0) ? (
            <p style={{ fontSize: "0.82rem", color: "rgba(194,251,239,0.3)" }}>No submissions yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {submissions.map((s: Record<string, unknown>) => (
                <div
                  key={s.id as string}
                  style={{ padding: "12px 14px", borderLeft: "3px solid rgba(0,163,139,0.2)", background: "rgba(0,0,0,0.15)" }}
                >
                  <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e8faf5" }}>{s.title as string}</p>
                  {(s.link_url as string) && (
                    <a href={s.link_url as string} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "#00a38b" }}>
                      {s.link_url as string}
                    </a>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span style={{ fontSize: "0.68rem", color: "rgba(194,251,239,0.35)" }}>
                      {(s.profiles as Record<string, unknown>)?.full_name as string || (s.profiles as Record<string, unknown>)?.email as string}
                    </span>
                    <span style={{ fontSize: "0.68rem", color: "rgba(194,251,239,0.15)" }}>·</span>
                    <span className="flex items-center gap-1">
                      <span style={groupColorDot(groupIndexMap[s.group_id as string] ?? 0, 5)} />
                      <span style={{ fontSize: "0.65rem", color: "rgba(194,251,239,0.3)" }}>
>>>>>>> 255ee2fbca49833994bcc1a595c1fbd75e814fa7
                        {groupNameMap[s.group_id as string] || "—"}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
