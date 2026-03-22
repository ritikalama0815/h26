import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { getCurrentProfile } from "@/lib/auth/profile"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Users, GitCommit,
  FileUp, MessageSquareWarning
} from "lucide-react"
import Link from "next/link"
import { getGroupColor } from "@/lib/group-colors"
import { InstructorQuestionCard } from "@/components/instructor/instructor-question-card"
import { ReportGenerator } from "@/components/groups/report-generator"

interface Props {
  params: Promise<{ projectId: string; groupId: string }>
}

export default async function InstructorGroupPage({ params }: Props) {
  const { projectId, groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = await getCurrentProfile()
  if (profile?.role !== "instructor") redirect("/dashboard/student")

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single()
  if (!project || project.created_by !== user?.id) notFound()

  const { data: group } = await supabase
    .from("project_groups")
    .select("*")
    .eq("id", groupId)
    .single()
  if (!group) notFound()

  const { data: members } = await supabase
    .from("memberships")
    .select("*, profiles ( full_name, email, github_username )")
    .eq("group_id", groupId)
    .eq("role", "member")

  const { data: commits } = await supabase
    .from("commits")
    .select("*")
    .eq("group_id", groupId)
    .order("committed_at", { ascending: false })
    .limit(20)

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*, profiles!submissions_submitted_by_fkey ( full_name, email )")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })

  const { count: docsActivityCount, error: docsCountErr } = await supabase
    .from("docs_activity")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)

  const docsLogged = docsCountErr ? 0 : docsActivityCount ?? 0
  const hasReportData =
    (commits?.length ?? 0) > 0 ||
    (submissions?.length ?? 0) > 0 ||
    docsLogged > 0

  const { data: questions } = await supabase
    .from("questions")
    .select("*, profiles!questions_asked_by_fkey ( full_name, email )")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })

  const gColor = getGroupColor(group.sort_order ?? 0)
  const openQuestions = (questions || []).filter((q) => !q.resolved).length

  const kpis = [
    { value: (members || []).length, label: "Members", color: gColor.hex, icon: Users },
    { value: (commits || []).length, label: "Commits", color: "#6b9e83", icon: GitCommit },
    { value: (submissions || []).length, label: "Submissions", color: "#00a38b", icon: FileUp },
    { value: openQuestions, label: "Open Qs", color: openQuestions > 0 ? "#f59e0b" : "#6b9e83", icon: MessageSquareWarning },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 sm:px-10 py-10 space-y-10">

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={`/dashboard/instructor/projects/${projectId}`}>
          <button className="mt-1 flex h-8 w-8 items-center justify-center transition-colors hover:bg-white/5" style={{ border: "1px solid rgba(0,163,139,0.12)" }}>
            <ArrowLeft className="h-3.5 w-3.5" style={{ color: "rgba(194,251,239,0.4)" }} />
          </button>
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: gColor.hex }} />
            <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.28em", color: "#6b9e83" }}>
              {project.name.toUpperCase()}
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.02em", color: "#e8faf5" }}>
            {group.name}
          </h1>
          <p style={{ fontSize: "0.82rem", color: "rgba(194,251,239,0.35)", marginTop: 6 }}>
            {(members || []).length} members{group.github_repo_url ? " · GitHub connected" : ""}
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-0" style={{ border: "1px solid rgba(0,163,139,0.1)" }}>
        {kpis.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} style={{ padding: "18px 20px", borderRight: i < 3 ? "1px solid rgba(0,163,139,0.08)" : undefined, position: "relative", overflow: "hidden" }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em", color: "rgba(194,251,239,0.3)" }}>
                  {s.label.toUpperCase()}
                </span>
                <Icon className="h-3 w-3" style={{ color: s.color, opacity: 0.5 }} />
              </div>
              <div style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 900, lineHeight: 1, color: s.color }}>
                {s.value}
              </div>
            </div>
          )
        })}
      </div>

      <ReportGenerator
        groupId={groupId}
        groupName={group.name}
        hasData={hasReportData}
        canViewReports
      />

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Members */}
        <div style={{ background: "rgba(17,17,22,0.4)", border: "1px solid rgba(0,163,139,0.08)", padding: "24px" }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-7 w-7 items-center justify-center" style={{ background: `${gColor.hex}12`, border: `1px solid ${gColor.hex}25` }}>
              <Users className="h-3.5 w-3.5" style={{ color: gColor.hex }} />
            </div>
            <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em" }}>
              Members
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(members || []).map((m) => {
              const p = m.profiles as { full_name: string | null; email: string | null; github_username: string | null } | null
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3"
                  style={{ padding: "10px 12px", borderLeft: `3px solid ${gColor.hex}`, background: "rgba(0,0,0,0.15)" }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center"
                    style={{ background: `${gColor.hex}15`, fontSize: "0.68rem", fontWeight: 800, color: gColor.hex }}
                  >
                    {(p?.full_name || p?.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e8faf5" }}>
                      {p?.full_name || p?.email}
                    </p>
                    <p className="truncate" style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "rgba(194,251,239,0.3)" }}>
                      {p?.github_username || "no GitHub"}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat info */}
        <div style={{ background: "rgba(17,17,22,0.4)", border: "1px solid rgba(0,163,139,0.08)", padding: "24px" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-7 w-7 items-center justify-center" style={{ background: "rgba(0,163,139,0.08)", border: "1px solid rgba(0,163,139,0.15)" }}>
              <MessageSquareWarning className="h-3.5 w-3.5" style={{ color: "#00a38b" }} />
            </div>
            <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em" }}>
              Group Chat
            </h3>
          </div>
          <p style={{ fontSize: "0.82rem", color: "rgba(194,251,239,0.4)", lineHeight: 1.6 }}>
            Chat is private to students. When they use{" "}
            <code style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", background: "rgba(0,163,139,0.08)", padding: "2px 6px", color: "#00a38b" }}>@question</code>{" "}
            in chat, the question appears below for you to answer.
          </p>
        </div>

        {/* Submissions */}
        <div style={{ background: "rgba(17,17,22,0.4)", border: "1px solid rgba(0,163,139,0.08)", padding: "24px" }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-7 w-7 items-center justify-center" style={{ background: "rgba(0,163,139,0.08)", border: "1px solid rgba(0,163,139,0.15)" }}>
              <FileUp className="h-3.5 w-3.5" style={{ color: "#00a38b" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em", lineHeight: 1 }}>
                Submissions
              </h3>
              <p style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.12em", color: "rgba(194,251,239,0.3)", marginTop: 2 }}>
                {(submissions || []).length} TOTAL
              </p>
            </div>
          </div>
          {(!submissions || submissions.length === 0) ? (
            <p style={{ fontSize: "0.82rem", color: "rgba(194,251,239,0.3)" }}>No submissions yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {submissions.map((s) => (
                <div key={s.id} style={{ padding: "12px 14px", borderLeft: "3px solid rgba(0,163,139,0.2)", background: "rgba(0,0,0,0.15)" }}>
                  <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e8faf5" }}>{s.title}</p>
                  {s.link_url && (
                    <a href={s.link_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "#00a38b" }}>
                      {s.link_url}
                    </a>
                  )}
                  {s.file_url && (
                    <a href={s.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "#00a38b" }}>
                      Download file
                    </a>
                  )}
                  {s.notes && <p style={{ fontSize: "0.72rem", color: "rgba(194,251,239,0.3)", marginTop: 4 }}>{s.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Questions */}
        <div style={{ background: "rgba(17,17,22,0.4)", border: "1px solid rgba(0,163,139,0.08)", padding: "24px" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-7 w-7 items-center justify-center" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <MessageSquareWarning className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em", lineHeight: 1 }}>
                Questions
              </h3>
              <p style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.12em", color: "rgba(194,251,239,0.3)", marginTop: 2 }}>
                VIA <code style={{ fontFamily: "var(--font-mono)" }}>@QUESTION</code>
              </p>
            </div>
          </div>
          {(!questions || questions.length === 0) ? (
            <p style={{ fontSize: "0.82rem", color: "rgba(194,251,239,0.3)" }}>No questions yet.</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <InstructorQuestionCard
                  key={q.id}
                  projectId={projectId}
                  question={{
                    id: q.id,
                    group_id: q.group_id,
                    content: q.content,
                    answer: q.answer,
                    resolved: q.resolved,
                    created_at: q.created_at,
                    profiles: q.profiles as { full_name: string | null; email: string | null } | null,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
