"use client"

import { useMemo } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatUnits, parseUnits } from "viem"

export function AmountValidator({
  amounts,
  mode,
  amountPer,
  totalAmount,
  balance,
  decimals = 18,
  symbol = "ETH",
}) {
  const validation = useMemo(() => {
    const issues = []
    const warnings = []
    
    if (!balance || !totalAmount) {
      return { isValid: false, issues, warnings }
    }
    
    // Check if total exceeds balance
    if (totalAmount > balance) {
      issues.push({
        type: "error",
        message: `Insufficient balance. You have ${formatUnits(balance, decimals)} ${symbol} but need ${formatUnits(totalAmount, decimals)} ${symbol}`,
      })
    }
    
    // Check for very small amounts
    if (mode === "equal" && amountPer) {
      try {
        const parsed = parseUnits(amountPer, decimals)
        if (parsed < parseUnits("0.0001", decimals)) {
          warnings.push({
            type: "warning",
            message: "Amount per recipient is very small. Consider using a larger amount.",
          })
        }
      } catch {
        // Invalid amount format
      }
    }
    
    // Check for very large amounts
    if (totalAmount > parseUnits("1000000", decimals)) {
      warnings.push({
        type: "warning",
        message: "Large transaction amount. Please double-check all details.",
      })
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
    }
  }, [amounts, mode, amountPer, totalAmount, balance, decimals, symbol])

  if (validation.issues.length === 0 && validation.warnings.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {validation.issues.map((issue, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 animate-in"
        >
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-destructive">{issue.message}</p>
        </div>
      ))}
      {validation.warnings.map((warning, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 animate-in"
        >
          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-yellow-500">{warning.message}</p>
        </div>
      ))}
    </div>
  )
}
