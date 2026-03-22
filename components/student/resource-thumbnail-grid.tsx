"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Link2,
  Globe,
  FileText,
  FolderGit2,
  ExternalLink,
  Copy,
  Check,
  ArrowUpRight,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface ResourceThumbnailItem {
  id: string
  title: string
  url: string
  resource_type: string
  created_at: string
  profiles: { full_name: string | null } | null
}

const typeIcons: Record<string, typeof Globe> = {
  link: Globe,
  document: FileText,
  repo: FolderGit2,
  other: Link2,
}

const typeColors: Record<string, { bg: string; text: string; ring: string }> = {
  link: { bg: "from-blue-500/20 to-blue-600/5", text: "text-blue-600", ring: "ring-blue-500/15" },
  document: { bg: "from-amber-500/20 to-amber-600/5", text: "text-amber-600", ring: "ring-amber-500/15" },
  repo: { bg: "from-emerald-500/20 to-emerald-600/5", text: "text-emerald-600", ring: "ring-emerald-500/15" },
  other: { bg: "from-muted to-muted/50", text: "text-muted-foreground", ring: "ring-border/30" },
}

const typeLabel: Record<string, string> = {
  link: "Link",
  document: "Doc",
  repo: "Repo",
  other: "Link",
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return ""
  }
}

function isGoogleUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return (
      host.includes("google.com") ||
      host.includes("docs.google.com") ||
      host.includes("drive.google.com") ||
      host.includes("slides.google.com") ||
      host.includes("sheets.google.com")
    )
  } catch {
    return false
  }
}

interface ResourceThumbnailGridProps {
  resources: ResourceThumbnailItem[]
  memberEmails: string[]
  portalHref?: string
}

export function ResourceThumbnailGrid({
  resources,
  memberEmails,
  portalHref,
}: ResourceThumbnailGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyAndOpen = async (id: string, url: string) => {
    await navigator.clipboard.writeText(memberEmails.join(", "))
    setCopiedId(id)
    setTimeout(() => window.open(url, "_blank"), 400)
    setTimeout(() => setCopiedId(null), 2200)
  }

  if (resources.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/50 bg-linear-to-b from-muted/30 to-transparent px-6 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-primary/15 to-violet-500/10 shadow-inner ring-1 ring-primary/20">
          <Link2 className="h-9 w-9 text-primary/80" />
        </div>
        <h3 className="mt-5 text-base font-semibold tracking-tight text-foreground">No resources yet</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Drop links in the Portal — they sync here so your whole flow stays in one place.
        </p>
        {portalHref && (
          <Button asChild variant="default" size="sm" className="mt-6 gap-2 rounded-xl px-6">
            <Link href={portalHref}>
              Add links in Portal
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {resources.map((r) => {
        const Icon = typeIcons[r.resource_type] || Link2
        const colors = typeColors[r.resource_type] || typeColors.other
        const domain = getDomain(r.url)
        const favicon = getFaviconUrl(r.url)
        const label = typeLabel[r.resource_type] || "Link"
        const showShare = memberEmails.length > 0 && isGoogleUrl(r.url)

        return (
          <div
            key={r.id}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/90 shadow-md shadow-black/4 ring-1 ring-border/30 transition-all duration-300",
              "hover:-translate-y-1 hover:shadow-xl hover:shadow-black/8 hover:ring-primary/20",
              "dark:shadow-black/40 dark:hover:shadow-black/60"
            )}
          >
            <div
              className={cn(
                "relative h-28 overflow-hidden bg-linear-to-br",
                colors.bg
              )}
            >
              <div className="absolute inset-0 bg-linear-to-t from-white/15 to-transparent dark:from-white/5" />
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Open ${r.title}`}
              >
                <Icon className={cn("h-12 w-12 opacity-20", colors.text)} />
                {favicon && (
                  <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <span
                      className={cn(
                        "rounded-2xl bg-background/90 p-2.5 shadow-lg ring-2 backdrop-blur-sm",
                        colors.ring
                      )}
                    >
                      <Image
                        src={favicon}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded-lg"
                        unoptimized
                      />
                    </span>
                  </span>
                )}
              </a>

              <span className="pointer-events-none absolute left-3 top-3 rounded-lg bg-background/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground/90 shadow-sm backdrop-blur-md">
                {label}
              </span>

              <div className="absolute right-2 top-2 flex gap-1.5">
                {showShare && (
                  <button
                    type="button"
                    onClick={() => void copyAndOpen(r.id, r.url)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shadow-md backdrop-blur-md transition-colors",
                      "bg-background/95 text-blue-600 ring-1 ring-border/40",
                      "hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60"
                    )}
                  >
                    {copiedId === r.id ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Share
                  </button>
                )}
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/95 text-muted-foreground shadow-md ring-1 ring-border/40 backdrop-blur-md transition-colors hover:text-foreground"
                  aria-label="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 flex-col border-t border-border/30 bg-card/50 p-4 transition-colors hover:bg-muted/20"
            >
              <p className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                {r.title}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                {favicon && (
                  <Image src={favicon} alt="" width={14} height={14} className="rounded-sm opacity-90" unoptimized />
                )}
                <span className="truncate font-medium">{domain}</span>
              </div>
              {r.profiles?.full_name && (
                <p className="mt-2 truncate text-[11px] text-muted-foreground/80">
                  Shared by <span className="text-foreground/80">{r.profiles.full_name}</span>
                </p>
              )}
            </a>
          </div>
        )
      })}
    </div>
  )
}
