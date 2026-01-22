"use client"

import { ExternalLink } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row md:py-4">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
          <p className="text-sm text-muted-foreground">
            Built for Base Network
          </p>
          <span className="hidden text-muted-foreground md:inline">•</span>
          <p className="text-sm text-muted-foreground">
            Gas Optimized • Secure
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="https://base.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Base
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </footer>
  )
}
