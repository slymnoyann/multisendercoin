"use client"

import { cn } from "@/lib/utils"

export function ProgressBar({ progress, className }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  )
}
