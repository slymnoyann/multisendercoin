"use client"

import { useState } from "react"
import { isAddress } from "viem"
import { Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AddressInput } from "./AddressInput"
import { cn } from "@/lib/utils"

export function RecipientInput({
  index,
  address,
  amount,
  mode,
  onAddressChange,
  onAmountChange,
  onRemove,
  decimals = 18,
}) {
  const isValid = address ? isAddress(address) : true

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-4 transition-all",
        isValid
          ? "border-border bg-card hover:border-primary/50"
          : "border-destructive/50 bg-destructive/5"
      )}
    >
      <div className="flex-1 space-y-3">
        <AddressInput
          value={address}
          onChange={onAddressChange}
          placeholder={`Recipient ${index + 1} address (0x...)`}
          showAddressBook={true}
        />
        {mode === "custom" && (
          <Input
            type="text"
            placeholder="Amount"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            inputMode="decimal"
            className="text-sm"
            aria-label={`Recipient ${index + 1} amount`}
          />
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label={`Remove recipient ${index + 1}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
