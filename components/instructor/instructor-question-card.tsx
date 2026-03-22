"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle2, ExternalLink } from "lucide-react"
import Link from "next/link"

export type InstructorQuestion = {
  id: string
  group_id: string
  content: string
  answer: string | null
  resolved: boolean | null
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
}

interface Props {
  question: InstructorQuestion
  projectId: string
}

export function InstructorQuestionCard({ question: q, projectId }: Props) {
  const [answer, setAnswer] = useState(q.answer || "")
  const [resolved, setResolved] = useState(!!q.resolved)
  const [saving, setSaving] = useState(false)

  const asker =
    q.profiles?.full_name || q.profiles?.email || "Student"

  const save = async (markResolved: boolean) => {
    setSaving(true)
    try {
      const res = await fetch("/api/questions/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: q.id,
          answer,
          markResolved,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(
          [data.error, data.hint].filter(Boolean).join("\n\n") || "Failed to save"
        )
        return
      }
      if (res.status === 207) {
        alert(
          data.error ||
            "Reply saved but it may not appear in the group chat. Run scripts/fix_messages_insert_rls.sql in Supabase."
        )
      }
      setResolved(markResolved)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: "14px 16px", borderLeft: resolved ? "3px solid #00a38b" : "3px solid #f59e0b", background: "rgba(0,0,0,0.15)" }} className="space-y-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e8faf5", lineHeight: 1.5 }}>{q.content}</p>
        {resolved && (
          <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", color: "#00a38b", background: "rgba(0,163,139,0.1)", padding: "2px 8px" }}>
            RESOLVED
          </span>
        )}
      </div>
      <p style={{ fontSize: "0.68rem", color: "rgba(194,251,239,0.35)" }}>
        From <span style={{ color: "rgba(194,251,239,0.6)" }}>{asker}</span>
        {" · "}
        {new Date(q.created_at).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <Textarea
        placeholder="Write a reply for your students…"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="min-h-[64px] text-sm resize-y"
        disabled={resolved}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving || resolved}
          onClick={() => save(false)}
          className="text-[11px] font-bold tracking-wide h-7 px-3"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "SAVE REPLY"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={saving || resolved}
          onClick={() => save(true)}
          className="text-[11px] font-bold tracking-wide h-7 px-3"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              RESOLVE
            </>
          )}
        </Button>
        <Button type="button" size="sm" variant="outline" asChild className="text-[11px] font-bold tracking-wide h-7 px-3">
          <Link
            href={`/dashboard/instructor/projects/${projectId}/groups/${q.group_id}`}
            className="gap-1"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            GROUP
          </Link>
        </Button>
      </div>
    </div>
  )
}
