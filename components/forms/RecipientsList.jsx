"use client"

import { useState, useCallback } from "react"
import { Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RecipientInput } from "./RecipientInput"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Users } from "lucide-react"
import { CSVUpload } from "@/components/features/CSVUpload"
import { useToast } from "@/lib/use-toast"

export function RecipientsList({
  mode,
  rows,
  setRows,
  amountPer,
  setAmountPer,
  decimals,
  isNative,
}) {
  const [showCSVModal, setShowCSVModal] = useState(false)
  const { toast } = useToast()

  const add = useCallback(() => {
    setRows((r) => [...r, { address: "", amount: "" }])
  }, [setRows])

  const remove = useCallback(
    (i) => {
      setRows((r) => r.filter((_, j) => j !== i))
    },
    [setRows]
  )

  const updateAddress = useCallback(
    (i, value) => {
      setRows((r) => {
        const n = [...r]
        if (!n[i]) n[i] = { address: "", amount: "" }
        n[i].address = value
        return n
      })
    },
    [setRows]
  )

  const updateAmount = useCallback(
    (i, value) => {
      setRows((r) => {
        const n = [...r]
        if (!n[i]) n[i] = { address: "", amount: "" }
        n[i].amount = value
        return n
      })
    },
    [setRows]
  )

  const handleCSVSuccess = useCallback(
    (recipients) => {
      setRows((r) => [...r, ...recipients])
      setShowCSVModal(false)
      toast({
        title: "Success!",
        description: `Added ${recipients.length} recipients from CSV`,
        variant: "success",
      })
    },
    [setRows, toast]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Recipients</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCSVModal(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <Plus className="mr-2 h-4 w-4" />
            Add Recipient
          </Button>
        </div>
      </div>

      {mode === "equal" && (
        <div className="space-y-2">
          <Label htmlFor="amount-per" className="text-sm font-semibold">
            Amount per recipient
          </Label>
          <div className="relative">
            <Input
              id="amount-per"
              type="text"
              placeholder="0.0"
              value={amountPer}
              onChange={(e) => setAmountPer(e.target.value)}
              className="pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {isNative ? "ETH" : "tokens"}
            </span>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No recipients"
          description="Add recipients manually or upload a CSV file"
          action={
            <Button type="button" variant="outline" onClick={add}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Recipient
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <RecipientInput
              key={i}
              index={i}
              address={row.address}
              amount={row.amount}
              mode={mode}
              onAddressChange={(value) => updateAddress(i, value)}
              onAmountChange={(value) => updateAmount(i, value)}
              onRemove={() => remove(i)}
              decimals={decimals}
            />
          ))}
        </div>
      )}

      {showCSVModal && (
        <CSVUpload
          mode={mode}
          onSuccess={handleCSVSuccess}
          onClose={() => setShowCSVModal(false)}
        />
      )}
    </div>
  )
}
