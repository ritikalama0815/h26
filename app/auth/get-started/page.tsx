"use client"

import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { GraduationCap, Presentation, ArrowRight } from "lucide-react"

const FloatingLines = dynamic(() => import("@/components/landing/floating-lines"), { ssr: false })

const PALETTE = ["#3b2b2e", "#6c3837", "#6b9e83", "#00a38b", "#c2fbef"]

export default function GetStartedPage() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden" style={{ background: "#0a0a0f" }}>
      {/* Shader bg */}
      <div className="absolute inset-0 z-0" style={{ opacity: 0.6 }}>
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

      <div className="relative z-10 w-full max-w-lg px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2.5">
            <Image src="/colab-logo.png" alt="CoLab" width={44} height={44} className="rounded-lg" />
            <span className="text-lg font-bold tracking-tight text-white">CoLab</span>
          </Link>

          {/* Heading */}
          <div className="text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <div style={{ width: 24, height: 2, background: "#00a38b" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.22em", color: "#6b9e83" }}>
                CHOOSE YOUR ROLE
              </span>
              <div style={{ width: 24, height: 2, background: "#00a38b" }} />
            </div>
            <h1 className="text-white" style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
              How will you use CoLab?
            </h1>
            <p style={{ fontSize: "0.92rem", color: "rgba(194,251,239,0.45)", marginTop: 8 }}>
              Teachers create projects and form groups; students join when invited.
            </p>
          </div>

          {/* Role cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Student */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <Link
                href="/auth/sign-up?role=student"
                className="group block p-6 transition-all duration-200"
                style={{
                  background: "rgba(10,10,15,0.85)",
                  border: "1px solid rgba(0,163,139,0.2)",
                  backdropFilter: "blur(12px)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,163,139,0.45)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(0,163,139,0.12)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,163,139,0.2)"; (e.currentTarget as HTMLElement).style.boxShadow = "none" }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center" style={{ background: "rgba(0,163,139,0.12)" }}>
                  <GraduationCap className="h-6 w-6" style={{ color: "#00a38b" }} />
                </div>
                <div className="text-white mb-1" style={{ fontSize: "1.1rem", fontWeight: 800 }}>Student</div>
                <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(194,251,239,0.4)", marginBottom: 16 }}>
                  Join your team, chat, divide tasks, and track progress together.
                </p>
                <div className="flex items-center gap-2 transition-all group-hover:gap-3" style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.12em", color: "#00a38b" }}>
                  CONTINUE <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </motion.div>

            {/* Teacher */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              <Link
                href="/auth/sign-up?role=instructor"
                className="group block p-6 transition-all duration-200"
                style={{
                  background: "rgba(10,10,15,0.85)",
                  border: "1px solid rgba(107,158,131,0.2)",
                  backdropFilter: "blur(12px)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(107,158,131,0.45)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(107,158,131,0.12)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(107,158,131,0.2)"; (e.currentTarget as HTMLElement).style.boxShadow = "none" }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center" style={{ background: "rgba(107,158,131,0.12)" }}>
                  <Presentation className="h-6 w-6" style={{ color: "#6b9e83" }} />
                </div>
                <div className="text-white mb-1" style={{ fontSize: "1.1rem", fontWeight: 800 }}>Teacher</div>
                <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(194,251,239,0.4)", marginBottom: 16 }}>
                  Create projects, form groups, monitor progress, and generate reports.
                </p>
                <div className="flex items-center gap-2 transition-all group-hover:gap-3" style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.12em", color: "#6b9e83" }}>
                  CONTINUE <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Login link */}
          <p className="text-center" style={{ fontSize: "0.85rem", color: "rgba(194,251,239,0.4)" }}>
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium underline underline-offset-4" style={{ color: "#00a38b" }}>
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
