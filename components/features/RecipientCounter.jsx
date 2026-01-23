"use client"

import { useMemo } from "react"
import { Users, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { isAddress } from "viem"

const MAX_RECIPIENTS = 200

export function RecipientCounter({ recipients, mode, amounts }) {
  const stats = useMemo(() => {
    const valid = recipients.filter((addr) => addr && isAddress(addr))
    const invalid = recipients.filter((addr) => addr && !isAddress(addr))
    const empty = recipients.filter((addr) => !addr || addr.trim() === "")
    const withAmounts = mode === "custom" 
      ? amounts.filter((amt, i) => valid.includes(recipients[i]) && amt && !isNaN(Number(amt)) && Number(amt) > 0).length
      : valid.length

    return {
      total: recipients.length,
      valid: valid.length,
      invalid: invalid.length,
      empty: empty.length,
      withAmounts,
      isNearLimit: valid.length >= MAX_RECIPIENTS * 0.9,
      isAtLimit: valid.length >= MAX_RECIPIENTS,
    }
  }, [recipients, mode, amounts])

  if (stats.total === 0) return null

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
      <div className="flex items-center gap-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Recipients</p>
            <p className="text-sm font-semibold">{stats.total}</p>
          </div>
          {stats.valid > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Valid</p>
              <p className="text-sm font-semibold text-green-500">{stats.valid}</p>
            </div>
          )}
          {stats.invalid > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Invalid</p>
              <p className="text-sm font-semibold text-destructive">{stats.invalid}</p>
            </div>
          )}
          {mode === "custom" && stats.withAmounts !== stats.valid && (
            <div>
              <p className="text-xs text-muted-foreground">With Amounts</p>
              <p className="text-sm font-semibold text-yellow-500">{stats.withAmounts}</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {stats.isAtLimit ? (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>Limit reached</span>
          </div>
        ) : stats.isNearLimit ? (
          <div className="flex items-center gap-1 text-xs text-yellow-500">
            <AlertCircle className="h-3 w-3" />
            <span>{MAX_RECIPIENTS - stats.valid} remaining</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span>{MAX_RECIPIENTS - stats.valid} remaining</span>
          </div>
        )}
      </div>
    </div>
  )
}
