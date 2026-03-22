import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Pin, Users, Mail, Clock } from "lucide-react"

interface Props {
  params: Promise<{ groupId: string }>
}

export default async function TeammatesPage({ params }: Props) {
  const { groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: group } = await supabase
    .from("project_groups")
    .select("name")
    .eq("id", groupId)
    .single()
  if (!group) notFound()

  const { data: memberRows } = await supabase
    .rpc("get_group_member_emails", { p_group_id: groupId })

  const members = (memberRows || []) as Array<{
    user_id: string
    email: string | null
    full_name: string | null
  }>

  const { data: allMessages } = await supabase
    .from("messages")
    .select("id, content, created_at, user_id, profiles ( full_name )")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(500)

  const pinnedMessages = (allMessages || []).filter((m) =>
    m.content.includes("@pin")
  )

  const initials = (name: string | null) => {
    if (!name) return "?"
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  }

  const accentColors = [
    "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b",
    "#f43f5e", "#06b6d4", "#ec4899", "#14b8a6",
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-10 py-2">

      {/* Members */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div style={{ width: 2, height: 18, background: "#00a38b" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.28em", color: "#6b9e83" }}>
            TEAM MEMBERS
          </span>
          <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "#00a38b" }}>
            {members.length}
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {members.map((m, i) => {
            const isMe = m.user_id === user!.id
            const accent = accentColors[i % accentColors.length]
            return (
              <div
                key={m.user_id}
                className="flex items-center gap-3"
                style={{
                  padding: "12px 14px",
                  background: "rgba(17,17,22,0.5)",
                  borderLeft: `3px solid ${accent}`,
                  border: `1px solid ${isMe ? "rgba(0,163,139,0.2)" : "rgba(0,163,139,0.08)"}`,
                  borderLeftWidth: 3,
                  borderLeftColor: accent,
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{ background: `${accent}18`, fontSize: "0.72rem", fontWeight: 800, color: accent }}
                >
                  {initials(m.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e8faf5" }}>
                      {m.full_name || "Unknown"}
                    </p>
                    {isMe && (
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", color: "#00a38b", background: "rgba(0,163,139,0.1)", padding: "1px 6px" }}>
                        YOU
                      </span>
                    )}
                  </div>
                  {m.email && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="h-2.5 w-2.5" style={{ color: "rgba(194,251,239,0.25)" }} />
                      <p className="truncate" style={{ fontSize: "0.7rem", color: "rgba(194,251,239,0.35)" }}>{m.email}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pinned Messages */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div style={{ width: 2, height: 18, background: "#6b9e83" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.28em", color: "#6b9e83" }}>
            PINNED MESSAGES
          </span>
          <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "#6b9e83" }}>
            {pinnedMessages.length}
          </span>
        </div>

        {pinnedMessages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-14 text-center"
            style={{ border: "1px dashed rgba(0,163,139,0.12)" }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center mb-4"
              style={{ background: "rgba(0,163,139,0.06)", border: "1px solid rgba(0,163,139,0.1)" }}
            >
              <Pin className="h-5 w-5" style={{ color: "#00a38b", opacity: 0.4 }} />
            </div>
            <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#e8faf5" }}>No pinned messages yet</p>
            <p style={{ fontSize: "0.72rem", color: "rgba(194,251,239,0.3)", marginTop: 4, lineHeight: 1.5 }}>
              Type <code style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", background: "rgba(0,163,139,0.08)", padding: "2px 6px", color: "#00a38b" }}>@pin</code> in chat to pin a message here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {pinnedMessages.map((msg) => {
              const senderName = (msg.profiles as { full_name: string | null } | null)?.full_name || "Unknown"
              const displayContent = msg.content.replace(/@pin/gi, "").trim()
              const isMe = msg.user_id === user!.id

              return (
                <div
                  key={msg.id}
                  style={{ padding: "12px 16px", borderLeft: "3px solid rgba(0,163,139,0.3)", background: "rgba(17,17,22,0.5)" }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Pin className="h-3 w-3" style={{ color: "#00a38b", opacity: 0.5 }} />
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#e8faf5" }}>
                        {senderName}
                        {isMe && <span style={{ color: "rgba(194,251,239,0.3)", marginLeft: 4 }}>(you)</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" style={{ color: "rgba(194,251,239,0.2)" }} />
                      <span style={{ fontSize: "0.62rem", color: "rgba(194,251,239,0.25)" }}>
                        {new Date(msg.created_at).toLocaleDateString(undefined, {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "rgba(194,251,239,0.7)", lineHeight: 1.6 }}>
                    {displayContent || <span style={{ color: "rgba(194,251,239,0.25)", fontStyle: "italic" }}>Pinned</span>}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
