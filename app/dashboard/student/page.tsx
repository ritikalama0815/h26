import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth/profile"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FolderKanban, ArrowRight, Settings, GraduationCap, AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { getGroupColor } from "@/lib/group-colors"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = await getCurrentProfile()

  if (profile?.role === "instructor") redirect("/dashboard/instructor")

  const { data: memberships } = await supabase
    .from("memberships")
    .select(`
      id, group_id, role, joined_at,
      projects ( id, name, description ),
      project_groups ( id, name, sort_order )
    `)
    .eq("user_id", user!.id)
    .eq("role", "member")

  const groups = (memberships || []).filter((m) => m.group_id)
  const displayName = user?.user_metadata?.full_name || user?.email || "Student"
  const firstName = (displayName as string).split(" ")[0]

  return (
    <div className="mx-auto max-w-5xl px-6 sm:px-10 py-10">

      {/* ── Header ── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 28, height: 2, background: "#00a38b" }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.28em", color: "#6b9e83" }}>
            STUDENT DASHBOARD
          </span>
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.02em", color: "#e8faf5" }}>
          Hey, {firstName}
        </h1>
        <p style={{ fontSize: "0.92rem", lineHeight: 1.6, color: "rgba(194,251,239,0.4)", marginTop: 8, maxWidth: 420 }}>
          {groups.length > 0
            ? `You're in ${groups.length} group${groups.length > 1 ? "s" : ""}. Pick one to jump in.`
            : "No groups yet — your instructor will add you soon."}
        </p>
      </div>

      {/* ── GitHub warning ── */}
      {!profile?.github_username && (
        <div
          className="mb-8 flex items-center gap-4 px-5 py-4"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderLeft: "3px solid #f59e0b" }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#f59e0b" }} />
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e8faf5", letterSpacing: "0.01em" }}>
              GitHub not linked
            </p>
            <p style={{ fontSize: "0.75rem", color: "rgba(194,251,239,0.4)", marginTop: 2 }}>
              Connect your username so commits are tracked automatically.
            </p>
          </div>
          <Link href="/dashboard/settings">
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
              <Settings className="h-3 w-3" /> Settings
            </Button>
          </Link>
        </div>
      )}

      {/* ── Groups ── */}
      {groups.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          style={{ border: "1px dashed rgba(0,163,139,0.15)" }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center mb-5"
            style={{ background: "rgba(0,163,139,0.06)", border: "1px solid rgba(0,163,139,0.12)" }}
          >
            <GraduationCap className="h-7 w-7" style={{ color: "#00a38b", opacity: 0.6 }} />
          </div>
          <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em" }}>
            No groups yet
          </p>
          <p style={{ fontSize: "0.82rem", color: "rgba(194,251,239,0.35)", marginTop: 6, maxWidth: 280, lineHeight: 1.5 }}>
            Your instructor will add you to a project group. Check back soon.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {groups.map((m, i) => {
            const project = m.projects as { id: string; name: string; description: string | null } | null
            const group = m.project_groups as { id: string; name: string; sort_order: number | null } | null
            const gColor = getGroupColor(group?.sort_order ?? 0)
            return (
              <Link key={m.id} href={`/dashboard/student/groups/${m.group_id}`}>
                <div
                  className="group relative overflow-hidden transition-all hover:translate-x-1"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px 1fr auto",
                    alignItems: "center",
                    background: "#0d0d16",
                    border: `1px solid rgba(0,163,139,0.12)`,
                    borderLeft: `4px solid ${gColor.hex}`,
                  }}
                >
                  {/* Index column */}
                  <div style={{ padding: "16px 0", textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: "1.4rem", fontWeight: 900, lineHeight: 1, color: gColor.hex }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>

                  {/* Main info */}
                  <div style={{ padding: "14px 20px" }}>
                    <div className="flex items-center gap-2.5 mb-1">
                      <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em" }}>
                        {group?.name || "Group"}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">{project?.name}</Badge>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "rgba(194,251,239,0.35)", lineHeight: 1.4 }}>
                      {project?.description || "No description"}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div style={{ padding: "14px 20px", borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: "rgba(194,251,239,0.25)" }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
