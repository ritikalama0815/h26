import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const BUCKET = "submission-files"

/**
 * Service-role client (server only). Used to create the storage bucket and
 * upload when RLS policies are not installed yet.
 */
export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function ensureSubmissionFilesBucket(): Promise<{
  ok: boolean
  error?: string
}> {
  const admin = getServiceSupabase()
  if (!admin) {
    return { ok: false, error: "no_service_role" }
  }

  const { data: buckets, error: listErr } = await admin.storage.listBuckets()
  if (listErr) {
    return { ok: false, error: listErr.message }
  }

  const exists = buckets?.some(
    (b) => b.id === BUCKET || b.name === BUCKET
  )
  if (exists) {
    return { ok: true }
  }

  const { error: createErr } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 52428800,
  })

  if (
    createErr &&
    !/already exists|duplicate|Bucket already exists/i.test(createErr.message)
  ) {
    return { ok: false, error: createErr.message }
  }

  return { ok: true }
}

export function submissionBucketName() {
  return BUCKET
}
