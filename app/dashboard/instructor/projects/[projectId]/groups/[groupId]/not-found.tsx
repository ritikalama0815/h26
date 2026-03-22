"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function InstructorGroupNotFound() {
  const path = usePathname()
  const match = path?.match(/\/projects\/([^/]+)\/groups\/([^/]+)/)
  const projectId = match?.[1]

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center space-y-5">
      <h1 className="text-2xl font-black tracking-tight" style={{ color: "#e8faf5" }}>
        Group not found
      </h1>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(194,251,239,0.45)" }}>
        This group doesn&apos;t exist on this project, the link may be outdated, or it may belong to a
        different project. Open the project from your dashboard and pick a group from the list.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        {projectId && (
          <Link
            href={`/dashboard/instructor/projects/${projectId}`}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-xs font-bold tracking-wide"
            style={{ background: "rgba(0,163,139,0.15)", border: "1px solid rgba(0,163,139,0.25)", color: "#00a38b" }}
          >
            Back to project
          </Link>
        )}
        <Link
          href="/dashboard/instructor"
          className="inline-flex items-center justify-center rounded-md px-4 py-2 text-xs font-bold tracking-wide"
          style={{ border: "1px solid rgba(0,163,139,0.12)", color: "rgba(194,251,239,0.5)" }}
        >
          Instructor home
        </Link>
      </div>
    </div>
  )
}
