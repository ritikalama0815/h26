"use client"

import { Badge } from "@/components/ui/badge"
import { GraduationCap } from "lucide-react"
import type { InstructorAnswerPayload } from "@/lib/chat-formats"

interface Props {
  payload: InstructorAnswerPayload
}

export function InstructorReplyCard({ payload }: Props) {
  return (
    <div className="w-full max-w-[95%] rounded-xl border border-emerald-300/40 bg-emerald-50/90 dark:bg-emerald-950/30 px-3 py-2.5 text-sm shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
        <GraduationCap className="h-3.5 w-3.5" />
        Instructor reply
        {payload.resolved && (
          <Badge variant="secondary" className="h-5 text-[9px]">
            Resolved
          </Badge>
        )}
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Question</p>
          <p className="rounded-md bg-background/60 px-2 py-1.5 text-sm leading-snug border border-border/50">
            {payload.question}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Reply</p>
          <p className="rounded-md bg-emerald-100/50 dark:bg-emerald-900/20 px-2 py-1.5 text-sm leading-relaxed whitespace-pre-wrap">
            {payload.answer ? (
              payload.answer
            ) : payload.resolved ? (
              <span className="italic text-muted-foreground">
                Marked as resolved (no written reply).
              </span>
            ) : (
              <span className="italic text-muted-foreground">—</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
