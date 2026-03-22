"use client"

import { createClient } from "@/lib/supabase/client"
import { syncProfileRole } from "@/lib/auth/sync-profile"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight } from "lucide-react"
import ElectricBorder from "@/components/ui/electric-border"

const FloatingLines = dynamic(() => import("@/components/landing/floating-lines"), { ssr: false })

const PALETTE = ["#3b2b2e", "#6c3837", "#6b9e83", "#00a38b", "#c2fbef"]

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await syncProfileRole()
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden" style={{ background: "#0a0a0f" }}>
      {/* Shader bg */}
      <div className="absolute inset-0 z-0" style={{ opacity: 0.5 }}>
        <FloatingLines
          linesGradient={PALETTE}
          enabledWaves={["middle", "bottom"]}
          lineCount={[4, 3]}
          lineDistance={[5, 6]}
          animationSpeed={0.4}
          interactive={false}
          parallax={false}
          mixBlendMode="screen"
        />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2.5">
            <Image src="/colab-logo.png" alt="CoLab" width={44} height={44} className="rounded-lg" />
            <span className="text-lg font-bold tracking-tight text-white">CoLab</span>
          </Link>

          {/* Card with ElectricBorder */}
          <ElectricBorder color="#00a38b" speed={0.8} chaos={0.08} borderRadius={0}>
            <div
              style={{
                background: "rgba(10,10,15,0.92)",
                backdropFilter: "blur(16px)",
                padding: "28px 24px",
              }}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ width: 20, height: 2, background: "#00a38b" }} />
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.22em", color: "#6b9e83" }}>SIGN IN</span>
                </div>
                <h1 className="text-white" style={{ fontSize: "1.5rem", fontWeight: 900, lineHeight: 1.1 }}>Welcome back</h1>
                <p style={{ fontSize: "0.88rem", color: "rgba(194,251,239,0.4)", marginTop: 4 }}>
                  Sign in to get back to your team
                </p>
              </div>

              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-white/70 text-xs font-bold" style={{ letterSpacing: "0.08em" }}>EMAIL</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-[#00a38b]/50 focus:ring-[#00a38b]/20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-white/70 text-xs font-bold" style={{ letterSpacing: "0.08em" }}>PASSWORD</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-[#00a38b]/50 focus:ring-[#00a38b]/20"
                    />
                  </div>
                  {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex w-full items-center justify-center gap-2 text-white transition-all duration-200 disabled:opacity-50"
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      padding: "12px 24px",
                      background: "linear-gradient(135deg, #00a38b, #6b9e83)",
                      boxShadow: "0 0 20px rgba(0,163,139,0.25)",
                    }}
                  >
                    {isLoading ? "LOGGING IN..." : "LOGIN"}
                    {!isLoading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                  </button>
                </div>
                <div className="mt-5 text-center" style={{ fontSize: "0.85rem", color: "rgba(194,251,239,0.4)" }}>
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/get-started" className="font-medium underline underline-offset-4" style={{ color: "#00a38b" }}>
                    Sign up
                  </Link>
                </div>
              </form>
            </div>
          </ElectricBorder>
        </motion.div>
      </div>
    </div>
  )
}
