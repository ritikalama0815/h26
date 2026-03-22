"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
    <div className="rounded-md border border-border p-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{q.content}</p>
        {resolved && (
          <Badge variant="secondary" className="text-[10px] shrink-0">
            Resolved
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        From <span className="text-foreground/80">{asker}</span>
        {" · "}
        {new Date(q.created_at).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <Textarea
        placeholder="Write a reply for your students (optional)…"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="min-h-[72px] text-sm resize-y"
        disabled={resolved}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={saving || resolved}
          onClick={() => save(false)}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Save reply"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={saving || resolved}
          onClick={() => save(true)}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Mark resolved
            </>
          )}
        </Button>
        <Button type="button" size="sm" variant="outline" asChild>
          <Link
            href={`/dashboard/instructor/projects/${projectId}/groups/${q.group_id}`}
            className="gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Group
          </Link>
        </Button>
      </div>
    </div>
  )
}
