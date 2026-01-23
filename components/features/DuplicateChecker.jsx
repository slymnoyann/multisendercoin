"use client"

import { useMemo } from "react"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function DuplicateChecker({ recipients }) {
  const duplicates = useMemo(() => {
    const seen = new Set()
    const dupes = new Set()
    
    recipients.forEach((addr) => {
      if (addr && addr.trim()) {
        const normalized = addr.toLowerCase().trim()
        if (seen.has(normalized)) {
          dupes.add(normalized)
        } else {
          seen.add(normalized)
        }
      }
    })
    
    return Array.from(dupes)
  }, [recipients])

  if (duplicates.length === 0) return null

  return (
    <div className="flex items-start gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-500">Duplicate addresses detected</p>
        <p className="text-xs text-yellow-500/80 mt-1">
          {duplicates.length} duplicate address{duplicates.length > 1 ? "es" : ""} found. Please remove duplicates before sending.
        </p>
      </div>
    </div>
  )
}
