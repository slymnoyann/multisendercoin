"use client"

"use client"

import { useState } from "react"
import { Copy, ExternalLink, History, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/feedback/EmptyState"
import { useToast } from "@/lib/use-toast"
import { cn } from "@/lib/utils"

export function TransactionHistory({ history, showHistory, setShowHistory }) {
  const [copiedId, setCopiedId] = useState(null)
  const { toast } = useToast()

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const copyToClipboard = async (text, id) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast({
      title: "Copied!",
      description: "Transaction hash copied to clipboard",
      variant: "success",
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!showHistory) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setShowHistory(true)}
      >
        <History className="mr-2 h-4 w-4" />
        Show Transaction History ({history.length})
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <EmptyState
            icon={History}
            title="No transactions yet"
            description="Your successful transactions will appear here"
          />
        ) : (
          <div className="space-y-3">
            {history.map((tx) => (
              <div
                key={tx.id}
                className="group rounded-lg border bg-card p-4 transition-all hover:border-primary/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      {tx.isNative ? (
                        <span className="text-lg">💰</span>
                      ) : (
                        <span className="text-lg">🪙</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{tx.token}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Recipients</p>
                    <p className="font-semibold">{tx.recipientCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold">
                      {tx.totalAmount} {tx.token}
                    </p>
                  </div>
                  {tx.fee > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Fee</p>
                      <p className="font-semibold">
                        {tx.fee} {tx.token}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Mode</p>
                    <p className="font-semibold">
                      {tx.mode === "equal" ? "Equal" : "Custom"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyToClipboard(tx.hash, tx.id)}
                    >
                      <Copy
                        className={cn(
                          "mr-2 h-3 w-3",
                          copiedId === tx.id && "text-green-500"
                        )}
                      />
                      Copy Hash
                    </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a
                      href={`https://basescan.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      View on BaseScan
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
