import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth/profile"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus, FolderKanban, Users, GitCommit,
  ArrowRight, MessageSquareWarning, ArrowUpRight
} from "lucide-react"
import Link from "next/link"

export default async function InstructorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = await getCurrentProfile()

  if (profile?.role !== "instructor") redirect("/dashboard/student")

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("created_by", user!.id)
    .order("created_at", { ascending: false })

  const projectIds = (projects || []).map((p) => p.id)

  const { data: allGroups } = projectIds.length > 0
    ? await supabase
        .from("project_groups")
        .select("id, project_id, name, github_repo_url")
        .in("project_id", projectIds)
    : { data: [] }

  const groupIds = (allGroups || []).map((g) => g.id)

  const { count: totalStudents } = projectIds.length > 0
    ? await supabase
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .in("project_id", projectIds)
        .eq("role", "member")
    : { count: 0 }

  const { count: totalQuestions } = groupIds.length > 0
    ? await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .in("group_id", groupIds)
        .eq("resolved", false)
    : { count: 0 }

  const displayName = user?.user_metadata?.full_name || user?.email || "Instructor"
  const firstName = (displayName as string).split(" ")[0]

  const groupCountMap: Record<string, number> = {}
  const studentCountMap: Record<string, number> = {}
  for (const g of allGroups || []) {
    groupCountMap[g.project_id] = (groupCountMap[g.project_id] || 0) + 1
  }

  if (projectIds.length > 0) {
    const { data: memberRows } = await supabase
      .from("memberships")
      .select("project_id")
      .in("project_id", projectIds)
      .eq("role", "member")
    for (const m of memberRows || []) {
      studentCountMap[m.project_id] = (studentCountMap[m.project_id] || 0) + 1
    }
  }

  const kpis = [
    { value: projects?.length || 0, label: "Projects", sub: "active", color: "#00a38b", icon: FolderKanban },
    { value: totalStudents || 0, label: "Students", sub: "enrolled", color: "#6b9e83", icon: Users },
    { value: allGroups?.length || 0, label: "Groups", sub: "total", color: "#c2fbef", icon: GitCommit },
    { value: totalQuestions || 0, label: "Questions", sub: "open", color: totalQuestions ? "#f59e0b" : "#6b9e83", icon: MessageSquareWarning },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 sm:px-10 py-10">

      {/* ── Header ── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 28, height: 2, background: "#00a38b" }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.28em", color: "#6b9e83" }}>
              INSTRUCTOR DASHBOARD
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.02em", color: "#e8faf5" }}>
            Welcome, {firstName}
          </h1>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.6, color: "rgba(194,251,239,0.4)", marginTop: 8 }}>
            Manage your projects and student groups.
          </p>
        </div>
        <Link href="/dashboard/instructor/projects/new">
          <Button variant="gradient" className="gap-2 h-10 px-5 text-sm font-bold tracking-wide">
            <Plus className="h-4 w-4" /> NEW PROJECT
          </Button>
        </Link>
      </div>

      {/* ── KPI scoreboard ── */}
      <div
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 mb-12"
        style={{ border: "1px solid rgba(0,163,139,0.1)" }}
      >
        {kpis.map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={i}
              style={{
                padding: "24px 24px",
                borderRight: i < 3 ? "1px solid rgba(0,163,139,0.08)" : undefined,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Ghost number */}
              <div style={{ position: "absolute", bottom: -12, right: -4, fontSize: "5rem", color: `${s.color}06`, fontWeight: 900, lineHeight: 1, userSelect: "none" }}>
                {i + 1}
              </div>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", color: "rgba(194,251,239,0.35)" }}>
                  {s.label.toUpperCase()}
                </span>
                <Icon className="h-3.5 w-3.5" style={{ color: s.color, opacity: 0.6 }} />
              </div>
              <div style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", fontWeight: 900, lineHeight: 1, color: s.color, marginBottom: 2 }}>
                {s.value}
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(194,251,239,0.3)", marginTop: 2 }}>
                {s.sub}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Projects section ── */}
      <div>
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div style={{ position: "relative" }}>
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: 2, height: 20, background: "#00a38b" }} />
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.28em", color: "#6b9e83" }}>
                YOUR PROJECTS
              </span>
            </div>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.01em", color: "#e8faf5", paddingBottom: 8 }}>
              Active Projects
            </h2>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "50%", height: 2, background: "linear-gradient(90deg, #00a38b, transparent)" }} />
          </div>
        </div>

        {(!projects || projects.length === 0) ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            style={{ border: "1px dashed rgba(0,163,139,0.15)", background: "rgba(17,17,22,0.3)" }}
          >
            <div
              className="flex h-16 w-16 items-center justify-center mb-5"
              style={{ background: "rgba(0,163,139,0.06)", border: "1px solid rgba(0,163,139,0.12)" }}
            >
              <FolderKanban className="h-7 w-7" style={{ color: "#00a38b", opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em" }}>
              No projects yet
            </p>
            <p style={{ fontSize: "0.82rem", color: "rgba(194,251,239,0.35)", marginTop: 6, maxWidth: 280, lineHeight: 1.5 }}>
              Create your first project to start managing student groups.
            </p>
            <Link href="/dashboard/instructor/projects/new" className="mt-6">
              <Button variant="gradient" className="gap-2 text-sm font-bold tracking-wide">
                <Plus className="h-4 w-4" /> CREATE PROJECT
              </Button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {projects.map((project, i) => (
              <Link key={project.id} href={`/dashboard/instructor/projects/${project.id}`}>
                <div
                  className="group relative overflow-hidden transition-all hover:translate-x-1"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "64px 1fr auto",
                    alignItems: "center",
                    background: "#0d0d16",
                    border: "1px solid rgba(0,163,139,0.1)",
                    borderLeft: "4px solid #00a38b",
                  }}
                >
                  {/* Index */}
                  <div style={{ padding: "18px 0", textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: 900, lineHeight: 1, color: "#00a38b" }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: "14px 20px" }}>
                    <div className="flex items-center gap-3 mb-1">
                      <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em" }}>
                        {project.name}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "rgba(194,251,239,0.35)", lineHeight: 1.4 }}>
                      {project.description || "No description"}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="hidden sm:flex items-center gap-3 pr-5" style={{ borderLeft: "1px solid rgba(255,255,255,0.04)", padding: "14px 20px" }}>
                    <Badge variant="secondary" className="text-[10px]">
                      {groupCountMap[project.id] || 0} groups
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {studentCountMap[project.id] || 0} students
                    </Badge>
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: "rgba(194,251,239,0.2)" }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
