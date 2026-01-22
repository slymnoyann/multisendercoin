"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function LoadingState({ className, text, size = "default", children }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  }

  if (children) {
    return (
      <div className={cn("inline-flex items-center", className)}>
        <Loader2 className={cn("animate-spin text-current", sizeClasses[size])} />
        {children}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}
