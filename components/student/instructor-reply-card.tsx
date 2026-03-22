"use client"

import { Badge } from "@/components/ui/badge"
import { GraduationCap } from "lucide-react"
import type { InstructorAnswerPayload } from "@/lib/chat-formats"

interface Props {
  payload: InstructorAnswerPayload
}

export function InstructorReplyCard({ payload }: Props) {
  return (
    <div className="w-full max-w-[95%] rounded-xl border border-[rgba(0,163,139,0.15)] bg-[#141419] px-3 py-2.5 text-sm shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
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
          <p className="rounded-md border border-[rgba(0,163,139,0.1)] bg-[rgba(17,17,22,0.5)] px-2 py-1.5 text-sm leading-snug">
            {payload.question}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Reply</p>
          <p className="rounded-md border border-[rgba(0,163,139,0.1)] bg-[rgba(0,163,139,0.08)] px-2 py-1.5 text-sm leading-relaxed whitespace-pre-wrap">
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
