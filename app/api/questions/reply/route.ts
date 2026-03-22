import { createClient } from "@/lib/supabase/server"
import {
  INSTRUCTOR_ANSWER_PREFIX,
  type InstructorAnswerPayload,
} from "@/lib/chat-formats"
import { NextRequest, NextResponse } from "next/server"

/**
 * Instructor updates a question and optionally posts a structured message to group chat
 * so students see the question + answer in the chat stream.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const questionId = body.questionId as string | undefined
    const answerRaw = (body.answer as string | undefined) ?? ""
    const markResolved = Boolean(body.markResolved)

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 })
    }

    const { data: q, error: qErr } = await supabase
      .from("questions")
      .select("id, group_id, content")
      .eq("id", questionId)
      .single()

    if (qErr || !q) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const { data: isOwner, error: rpcErr } = await supabase.rpc(
      "is_group_project_owner",
      { p_group_id: q.group_id }
    )

    if (rpcErr) {
      console.error("[questions/reply] rpc", rpcErr)
      return NextResponse.json({ error: rpcErr.message }, { status: 400 })
    }

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const answer = answerRaw.trim() || null

    const { error: upErr } = await supabase
      .from("questions")
      .update({
        answer,
        answered_by: user.id,
        resolved: markResolved,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId)

    if (upErr) {
      console.error("[questions/reply] update", upErr)
      return NextResponse.json({ error: upErr.message }, { status: 400 })
    }

    const shouldPostChat = markResolved || (answer && answer.length > 0)

    if (shouldPostChat) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle()

      const payload: InstructorAnswerPayload = {
        questionId: q.id,
        question: q.content,
        answer: answer ?? "",
        resolved: markResolved,
        instructorName: prof?.full_name ?? undefined,
      }

      const { error: msgErr } = await supabase.from("messages").insert({
        group_id: q.group_id,
        user_id: user.id,
        content: `${INSTRUCTOR_ANSWER_PREFIX}${JSON.stringify(payload)}`,
      })

      if (msgErr) {
        console.error("[questions/reply] message insert", msgErr)
        return NextResponse.json(
          {
            error: `Saved reply, but chat message failed: ${msgErr.message}`,
            hint:
              msgErr.message.includes("policy") || msgErr.code === "42501"
                ? "Run scripts/fix_messages_insert_rls.sql in the Supabase SQL Editor (merges INSERT policy so instructors can post)."
                : undefined,
          },
          { status: 207 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[questions/reply]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    )
  }
}
