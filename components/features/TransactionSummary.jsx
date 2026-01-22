"use client"

import { formatUnits } from "viem"
import { Users, Coins, DollarSign, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/feedback/Skeleton"

export function TransactionSummary({
  totalAmount,
  recipientCount,
  fee,
  symbol,
  isNative,
  gasEstimate,
  isLoading = false,
}) {
  if (!totalAmount || recipientCount === 0) return null

  const formatGas = (gas) => {
    if (!gas) return "Estimating..."
    return `${(Number(gas) / 1e9).toFixed(2)} gwei`
  }

  const estimatedCost = gasEstimate
    ? (Number(gasEstimate) * 0.000000001 * 0.0001).toFixed(4)
    : null

  const stats = [
    {
      label: "Recipients",
      value: recipientCount,
      icon: Users,
    },
    {
      label: "Total Amount",
      value: `${formatUnits(totalAmount, 18)} ${symbol || "ETH"}`,
      icon: Coins,
    },
    ...(fee > 0n
      ? [
          {
            label: "Service Fee",
            value: `${formatUnits(fee, 18)} ${symbol || "ETH"}`,
            icon: DollarSign,
          },
        ]
      : []),
    ...(gasEstimate
      ? [
          {
            label: "Gas Estimate",
            value: formatGas(gasEstimate),
            icon: Zap,
          },
        ]
      : []),
    ...(estimatedCost
      ? [
          {
            label: "Est. Cost",
            value: `~$${estimatedCost}`,
            icon: DollarSign,
          },
        ]
      : []),
  ]

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Transaction Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="flex flex-col gap-1 rounded-lg bg-background/50 p-3"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span>{stat.label}</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <p className="text-base font-semibold">{stat.value}</p>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
