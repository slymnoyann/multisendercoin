"use client"

import { Zap, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function GasEstimate({ gasEstimate, className }) {
  if (!gasEstimate) return null

  const gasGwei = Number(gasEstimate) / 1e9
  const estimatedCost = (gasGwei * 0.0001).toFixed(4)

  // Determine gas level (low/medium/high)
  const getGasLevel = (gwei) => {
    if (gwei < 20) return { level: "low", color: "text-green-500" }
    if (gwei < 50) return { level: "medium", color: "text-yellow-500" }
    return { level: "high", color: "text-red-500" }
  }

  const { level, color } = getGasLevel(gasGwei)

  return (
    <div className={cn("flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2", className)}>
      <Zap className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">Gas Estimate</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{gasGwei.toFixed(2)} gwei</p>
          <span className={cn("text-xs font-medium", color)}>
            ({level})
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Est. Cost</p>
        <p className="text-sm font-semibold">~${estimatedCost}</p>
      </div>
    </div>
  )
}
