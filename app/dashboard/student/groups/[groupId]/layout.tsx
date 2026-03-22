"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Briefcase } from "lucide-react"

const tabs = [
  { suffix: "", label: "Portal", icon: LayoutDashboard },
  { suffix: "/teammates", label: "Teammates", icon: Users },
  { suffix: "/workspace", label: "Workspace", icon: Briefcase },
]

export default function StudentGroupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const params = useParams<{ groupId: string }>()
  const base = `/dashboard/student/groups/${params.groupId}`

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="shrink-0 px-5 pt-4 pb-2">
        <nav className="flex gap-0.5 p-1" style={{ border: "1px solid rgba(0,163,139,0.08)", background: "rgba(17,17,22,0.5)" }}>
          {tabs.map((tab) => {
            const href = base + tab.suffix
            const isActive = tab.suffix === ""
              ? pathname === href
              : pathname.startsWith(href)
            const Icon = tab.icon
            return (
              <Link key={tab.suffix} href={href} className="flex-1">
                <div
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-2 transition-all",
                    isActive
                      ? "text-white"
                      : "hover:bg-white/4"
                  )}
                  style={isActive ? {
                    background: "rgba(0,163,139,0.12)",
                    boxShadow: "inset 0 0 0 1px rgba(0,163,139,0.2)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  } : {
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "rgba(194,251,239,0.35)",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>
      {/* Content fills remaining height */}
      <div className="flex-1 min-h-0 px-5 pb-4">
        {children}
      </div>
    </div>
  )
}
