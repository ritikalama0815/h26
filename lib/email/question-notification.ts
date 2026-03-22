/**
 * Notify project instructor when a student submits a question (Resend HTTP API).
 * Set RESEND_API_KEY and EMAIL_FROM in .env — if missing, logs and skips (request still succeeds).
 */

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export type QuestionEmailPayload = {
  instructorEmail: string
  askerName: string
  questionText: string
  projectName: string
  groupName: string
  openInAppUrl: string
}

export async function sendInstructorQuestionEmail(
  payload: QuestionEmailPayload
): Promise<{ ok: boolean; skipped?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || "CoLab <onboarding@resend.dev>"

  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY not set — instructor question email skipped"
    )
    return { ok: false, skipped: "no_resend_api_key" }
  }

  if (!payload.instructorEmail?.includes("@")) {
    console.warn("[email] Invalid instructor email — skipped")
    return { ok: false, skipped: "no_instructor_email" }
  }

  const subject = `New student question — ${payload.projectName} (${payload.groupName})`

  const html = `
  <div style="font-family: system-ui, sans-serif; max-width: 560px; line-height: 1.5;">
    <p style="font-size: 14px; color: #444;">A student asked a question in <strong>${escapeHtml(payload.projectName)}</strong> · <strong>${escapeHtml(payload.groupName)}</strong>.</p>
    <p style="font-size: 13px; color: #666;"><strong>From:</strong> ${escapeHtml(payload.askerName)}</p>
    <blockquote style="margin: 12px 0; padding: 12px 16px; border-left: 4px solid #10b981; background: #f8fafc; font-size: 14px;">
      ${escapeHtml(payload.questionText)}
    </blockquote>
    <p style="margin-top: 16px;">
      <a href="${escapeHtml(payload.openInAppUrl)}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-size: 14px;">Open in CoLab</a>
    </p>
  </div>
  `.trim()

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.instructorEmail],
        subject,
        html,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      console.error("[email] Resend error:", res.status, data)
      return {
        ok: false,
        error: typeof data === "object" && data && "message" in data
          ? String((data as { message: unknown }).message)
          : res.statusText,
      }
    }

    return { ok: true }
  } catch (e) {
    console.error("[email] send failed:", e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : "fetch failed",
    }
  }
}
