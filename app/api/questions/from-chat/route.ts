import { sendInstructorQuestionEmail } from "@/lib/email/question-notification"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

function appBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (explicit) return explicit
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
  return ""
}

/**
 * Inserts a row into `questions` using the server Supabase client (session from cookies).
 * Used after a chat message is saved so instructors see it in their Questions menu.
 * Optionally emails the project instructor (Resend + get_project_instructor_email RPC).
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
    const groupId = body.groupId as string | undefined
    const content = (body.content as string | undefined)?.trim()

    if (!groupId || !content) {
      return NextResponse.json(
        { error: "groupId and content are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("questions")
      .insert({
        group_id: groupId,
        asked_by: user.id,
        content,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[questions/from-chat]", error)
      return NextResponse.json(
        {
          error: error.message,
          hint:
            error.code === "42P01"
              ? "Run the SQL in scripts/RUN_THIS.sql (questions table) in Supabase."
              : error.message.includes("row-level security")
                ? "Check RLS policies for public.questions (group member insert)."
                : undefined,
        },
        { status: 400 }
      )
    }

    // Notify instructor by email (non-blocking for client; failures only logged)
    try {
      const [{ data: instructorEmail }, { data: meta }, { data: asker }] =
        await Promise.all([
          supabase.rpc("get_project_instructor_email", { p_group_id: groupId }),
          supabase
            .from("project_groups")
            .select("name, project_id, projects(name)")
            .eq("id", groupId)
            .single(),
          supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", user.id)
            .single(),
        ])

      const projects = meta?.projects as { name: string } | null
      const projectName = projects?.name ?? "Project"
      const groupName = meta?.name ?? "Group"
      const projectId = meta?.project_id as string | undefined
      const askerName =
        asker?.full_name || asker?.email || "A student"

      const base = appBaseUrl()
      const openInAppUrl =
        base && projectId
          ? `${base}/dashboard/instructor/projects/${projectId}/groups/${groupId}`
          : base || "#"

      const emailResult = await sendInstructorQuestionEmail({
        instructorEmail: (instructorEmail as string | null) ?? "",
        askerName,
        questionText: content,
        projectName,
        groupName,
        openInAppUrl,
      })

      if (!emailResult.ok && emailResult.skipped === "no_resend_api_key") {
        // expected in dev without Resend
      } else if (!emailResult.ok) {
        console.warn("[questions/from-chat] email:", emailResult.error || emailResult.skipped)
      }
    } catch (notifyErr) {
      console.error("[questions/from-chat] notify instructor:", notifyErr)
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (e) {
    console.error("[questions/from-chat]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    )
  }
}
