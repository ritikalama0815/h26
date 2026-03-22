"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { User, Github, Check, AlertTriangle, Copy } from "lucide-react"

interface Profile {
  id: string
  full_name: string | null
  github_username: string | null
  avatar_url: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState("")
  const [githubUsername, setGithubUsername] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || "")
        setGithubUsername(profileData.github_username || "")
      }
      setIsLoading(false)
    }

    fetchProfile()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          github_username: githubUsername || null,
        })
        .eq("id", user.id)

      if (error) throw error

      await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

      setMessage({ type: "success", text: "Profile updated successfully" })
      router.refresh()
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const copyId = async () => {
    if (!profile?.id) return
    await navigator.clipboard.writeText(profile.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "rgba(0,163,139,0.3)", borderTopColor: "transparent" }} />
          <span style={{ fontSize: "0.82rem", color: "rgba(194,251,239,0.4)" }}>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-6 sm:px-10 py-10">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 28, height: 2, background: "#00a38b" }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.28em", color: "#6b9e83" }}>
            ACCOUNT
          </span>
        </div>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.02em", color: "#e8faf5" }}>
          Settings
        </h1>
      </div>

      {/* Profile form */}
      <div
        className="mb-6"
        style={{ background: "rgba(17,17,22,0.5)", border: "1px solid rgba(0,163,139,0.1)", padding: "28px 28px" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center" style={{ background: "rgba(0,163,139,0.08)", border: "1px solid rgba(0,163,139,0.15)" }}>
            <User className="h-4 w-4" style={{ color: "#00a38b" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.01em" }}>
              Profile
            </h2>
            <p style={{ fontSize: "0.72rem", color: "rgba(194,251,239,0.35)" }}>
              Your personal information
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-xs font-semibold tracking-wide" style={{ color: "rgba(194,251,239,0.5)" }}>
              FULL NAME
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="githubUsername" className="text-xs font-semibold tracking-wide" style={{ color: "rgba(194,251,239,0.5)" }}>
              <span className="flex items-center gap-1.5">
                <Github className="h-3 w-3" /> GITHUB USERNAME
              </span>
            </Label>
            <Input
              id="githubUsername"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="janedoe"
            />
            <p style={{ fontSize: "0.68rem", color: "rgba(194,251,239,0.3)", lineHeight: 1.5 }}>
              Used to link commits to your profile automatically.
            </p>
          </div>

          {message && (
            <div
              className="flex items-center gap-2 px-3 py-2.5"
              style={{
                background: message.type === "success" ? "rgba(0,163,139,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${message.type === "success" ? "rgba(0,163,139,0.2)" : "rgba(239,68,68,0.2)"}`,
              }}
            >
              {message.type === "success"
                ? <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "#00a38b" }} />
                : <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "#ef4444" }} />
              }
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: message.type === "success" ? "#00a38b" : "#ef4444" }}>
                {message.text}
              </span>
            </div>
          )}

          <Button type="submit" disabled={isSaving} className="h-9 px-5 text-xs font-bold tracking-wide">
            {isSaving ? "SAVING..." : "SAVE CHANGES"}
          </Button>
        </form>
      </div>

      {/* Account info */}
      <div
        style={{ background: "rgba(17,17,22,0.5)", border: "1px solid rgba(0,163,139,0.1)", padding: "24px 28px" }}
      >
        <h2 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "0.02em", marginBottom: 12 }}>
          Account
        </h2>
        <div>
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(194,251,239,0.35)" }}>
            USER ID
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <code
              className="flex-1 truncate"
              style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "rgba(194,251,239,0.6)", background: "rgba(0,0,0,0.2)", padding: "6px 10px", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              {profile?.id}
            </code>
            <button
              onClick={copyId}
              className="shrink-0 flex h-8 w-8 items-center justify-center transition-colors hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {copied
                ? <Check className="h-3.5 w-3.5" style={{ color: "#00a38b" }} />
                : <Copy className="h-3.5 w-3.5" style={{ color: "rgba(194,251,239,0.3)" }} />
              }
            </button>
          </div>
          <p style={{ fontSize: "0.68rem", color: "rgba(194,251,239,0.25)", marginTop: 8, lineHeight: 1.5 }}>
            Share this ID with group owners to join their groups.
          </p>
        </div>
      </div>
    </div>
  )
}
