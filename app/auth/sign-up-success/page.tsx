"use client"

import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"

const FloatingLines = dynamic(() => import("@/components/landing/floating-lines"), { ssr: false })

const PALETTE = ["#3b2b2e", "#6c3837", "#6b9e83", "#00a38b", "#c2fbef"]

export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden" style={{ background: "#0a0a0f" }}>
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
          className="flex flex-col items-center gap-6"
        >
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/colab-logo.png" alt="CoLab" width={44} height={44} className="rounded-lg" />
            <span className="text-lg font-bold tracking-tight text-white">CoLab</span>
          </Link>

          <div
            className="w-full text-center"
            style={{
              background: "rgba(10,10,15,0.88)",
              border: "1px solid rgba(0,163,139,0.15)",
              backdropFilter: "blur(16px)",
              padding: "36px 28px",
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center"
              style={{ background: "rgba(0,163,139,0.12)" }}
            >
              <CheckCircle className="h-7 w-7" style={{ color: "#00a38b" }} />
            </motion.div>
            <h1 className="text-white mb-2" style={{ fontSize: "1.5rem", fontWeight: 900, lineHeight: 1.1 }}>
              Thank you for signing up!
            </h1>
            <p style={{ fontSize: "0.92rem", color: "rgba(194,251,239,0.45)", lineHeight: 1.6 }}>
              Please check your email to confirm your account before signing in.
            </p>
            <Link
              href="/auth/login"
              className="mt-6 inline-block text-white transition-all hover:brightness-110"
              style={{
                fontSize: "0.85rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                padding: "10px 24px",
                background: "linear-gradient(135deg, #00a38b, #6b9e83)",
                boxShadow: "0 0 20px rgba(0,163,139,0.25)",
              }}
            >
              GO TO LOGIN
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
