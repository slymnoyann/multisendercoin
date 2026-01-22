"use client"

import { cn } from "@/lib/utils"

export function Container({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
