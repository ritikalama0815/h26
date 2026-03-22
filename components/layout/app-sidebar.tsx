"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import {
  LogOut, PanelLeftClose, PanelLeft,
  Presentation, GraduationCap,
} from "lucide-react"

interface AppSidebarProps {
  user: {
    email?: string
    user_metadata?: Record<string, unknown>
  }
  isInstructor: boolean
}

interface NavItem {
  href: string
  label: string
}

const instructorLinks: NavItem[] = [
  { href: "/dashboard/instructor", label: "Dashboard" },
  { href: "/dashboard/instructor/projects", label: "Projects" },
  { href: "/dashboard/settings", label: "Settings" },
]

const studentLinks: NavItem[] = [
  { href: "/dashboard/student", label: "Dashboard" },
  { href: "/dashboard/student/groups", label: "My Groups" },
  { href: "/dashboard/settings", label: "Settings" },
]

function FlowingNavItem({
  href,
  label,
  isActive,
  isFirst,
  expanded,
}: {
  href: string
  label: string
  isActive: boolean
  isFirst: boolean
  expanded: boolean
}) {
  const itemRef = useRef<HTMLDivElement>(null)
  const marqueeRef = useRef<HTMLDivElement>(null)
  const marqueeInnerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<gsap.core.Tween | null>(null)
  const [reps, setReps] = useState(6)

  const findClosestEdge = useCallback(
    (mouseX: number, mouseY: number, w: number, h: number): "top" | "bottom" => {
      const topDist = Math.pow(mouseX - w / 2, 2) + Math.pow(mouseY, 2)
      const botDist = Math.pow(mouseX - w / 2, 2) + Math.pow(mouseY - h, 2)
      return topDist < botDist ? "top" : "bottom"
    },
    []
  )

  useEffect(() => {
    const calc = () => {
      if (!marqueeInnerRef.current) return
      const part = marqueeInnerRef.current.querySelector(".mq-part") as HTMLElement
      if (!part) return
      const pw = part.offsetWidth
      if (pw === 0) return
      const containerW = itemRef.current?.offsetWidth || 280
      setReps(Math.max(6, Math.ceil(containerW / pw) + 3))
    }
    calc()
    window.addEventListener("resize", calc)
    return () => window.removeEventListener("resize", calc)
  }, [label])

  useEffect(() => {
    const setup = () => {
      if (!marqueeInnerRef.current) return
      const part = marqueeInnerRef.current.querySelector(".mq-part") as HTMLElement
      if (!part) return
      const pw = part.offsetWidth
      if (pw === 0) return
      if (animationRef.current) animationRef.current.kill()
      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -pw,
        duration: 8,
        ease: "none",
        repeat: -1,
      })
    }
    const t = setTimeout(setup, 60)
    return () => {
      clearTimeout(t)
      if (animationRef.current) animationRef.current.kill()
    }
  }, [label, reps])

  const onEnter = (ev: React.MouseEvent) => {
    if (!expanded) return
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return
    const rect = itemRef.current.getBoundingClientRect()
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height)
    gsap
      .timeline({ defaults: { duration: 0.5, ease: "expo" } })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0)
  }

  const onLeave = (ev: React.MouseEvent) => {
    if (!expanded) return
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return
    const rect = itemRef.current.getBoundingClientRect()
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height)
    gsap
      .timeline({ defaults: { duration: 0.5, ease: "expo" } })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
  }

  return (
    <div
      ref={itemRef}
      className="flex-1 relative overflow-hidden"
      style={{
        borderTop: isFirst ? "none" : "1px solid rgba(0,163,139,0.06)",
        background: isActive ? "rgba(0,163,139,0.06)" : "transparent",
        borderLeft: isActive ? "2px solid #00a38b" : "2px solid transparent",
      }}
    >
      <Link
        href={href}
        className="flex items-center justify-center h-full relative cursor-pointer no-underline"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{ color: isActive ? "#e8faf5" : "rgba(194,251,239,0.4)" }}
      >
        {expanded ? (
          <span
            style={{
              fontSize: "clamp(0.9rem, 2.2vh, 1.3rem)",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
        ) : (
          <span
            style={{
              fontSize: "0.56rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              writingMode: "vertical-rl",
              textOrientation: "mixed",
            }}
          >
            {label}
          </span>
        )}
      </Link>

      {/* Marquee overlay */}
      <div
        ref={marqueeRef}
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none translate-y-[101%]"
        style={{ backgroundColor: "#00a38b" }}
      >
        <div className="h-full w-fit flex" ref={marqueeInnerRef}>
          {[...Array(reps)].map((_, i) => (
            <div className="mq-part flex items-center shrink-0" key={i}>
              <span
                className="whitespace-nowrap uppercase leading-none px-4"
                style={{
                  fontSize: "clamp(0.9rem, 2.2vh, 1.3rem)",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  color: "#0a0a0f",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  color: "rgba(10,10,15,0.3)",
                  margin: "0 8px",
                  fontSize: "clamp(0.7rem, 1.5vh, 1rem)",
                }}
              >
                ·
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AppSidebar({ user, isInstructor }: AppSidebarProps) {
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const expanded = pinned || hovered
  const links = isInstructor ? instructorLinks : studentLinks
  const displayName = (user.user_metadata?.full_name as string) || user.email || ""

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard/instructor" &&
     href !== "/dashboard/student" &&
     pathname.startsWith(href))

  return (
    <>
      {expanded && !pinned && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden"
          onClick={() => setHovered(false)}
        />
      )}

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col",
          "transition-[width] duration-(--transition-slow)",
          expanded ? "w-(--sidebar-width-expanded)" : "w-(--sidebar-width-collapsed)"
        )}
        style={{
          background: "#08080d",
          borderRight: "1px solid rgba(0,163,139,0.08)",
        }}
      >
        {/* Logo + role */}
        <div
          className="shrink-0 flex items-center gap-2.5 px-3 h-12"
          style={{ borderBottom: "1px solid rgba(0,163,139,0.06)" }}
        >
          <Image src="/colab-logo.png" alt="CoLab" width={36} height={36} className="shrink-0" />
          <div className={cn(
            "flex items-center gap-2 transition-opacity duration-200 overflow-hidden",
            expanded ? "opacity-100" : "opacity-0 w-0"
          )}>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#e8faf5", letterSpacing: "-0.02em" }}>
              CoLab
            </span>
            <span
              className="inline-flex items-center gap-1"
              style={{
                fontSize: "0.48rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                color: isInstructor ? "#00a38b" : "#6b9e83",
                background: isInstructor ? "rgba(0,163,139,0.08)" : "rgba(107,158,131,0.08)",
                padding: "2px 6px",
              }}
            >
              {isInstructor ? (
                <><Presentation className="h-2 w-2" /> TEACHER</>
              ) : (
                <><GraduationCap className="h-2 w-2" /> STUDENT</>
              )}
            </span>
          </div>
        </div>

        {/* Flowing nav items — fill remaining space */}
        <nav className="flex-1 flex flex-col min-h-0">
          {links.map((link, i) => (
            <FlowingNavItem
              key={link.href}
              href={link.href}
              label={link.label}
              isActive={isActive(link.href)}
              isFirst={i === 0}
              expanded={expanded}
            />
          ))}
        </nav>

        {/* Bottom strip */}
        <div className="shrink-0" style={{ borderTop: "1px solid rgba(0,163,139,0.06)" }}>
          {/* User */}
          <div className={cn(
            "flex items-center gap-2.5 px-3 transition-all duration-200",
            expanded ? "opacity-100 py-2.5" : "opacity-0 h-0 overflow-hidden py-0"
          )}>
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center"
              style={{ background: "rgba(0,163,139,0.1)", fontSize: "0.56rem", fontWeight: 800, color: "#00a38b" }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontSize: "0.7rem", fontWeight: 600, color: "#e8faf5" }}>{displayName}</p>
              <p className="truncate" style={{ fontSize: "0.56rem", color: "rgba(194,251,239,0.2)" }}>{user.email}</p>
            </div>
          </div>

          {/* Sign out + pin */}
          <div className="flex items-center">
            <button
              onClick={handleSignOut}
              className="flex-1 flex h-9 items-center justify-center gap-2 transition-colors hover:bg-white/3"
            >
              <LogOut className="h-3 w-3" style={{ color: "rgba(239,68,68,0.4)" }} />
              <span
                className={cn(
                  "transition-opacity duration-200",
                  expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                )}
                style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(239,68,68,0.4)" }}
              >
                SIGN OUT
              </span>
            </button>
            <button
              onClick={() => setPinned(!pinned)}
              className="flex h-9 w-9 shrink-0 items-center justify-center transition-colors hover:bg-white/3"
              title={pinned ? "Collapse sidebar" : "Pin sidebar open"}
              style={{ borderLeft: "1px solid rgba(0,163,139,0.06)" }}
            >
              {pinned ? (
                <PanelLeftClose className="h-3 w-3" style={{ color: "rgba(194,251,239,0.2)" }} />
              ) : (
                <PanelLeft className="h-3 w-3" style={{ color: "rgba(194,251,239,0.2)" }} />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
