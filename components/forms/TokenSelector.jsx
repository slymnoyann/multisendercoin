"use client"

import { useState } from "react"
import { isAddress, formatUnits } from "viem"
import { Coins, Wallet } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/feedback/Skeleton"
import { BASE_TOKENS } from "@/lib/contracts"
import { getTokenImage } from "@/lib/tokenImages"
import { cn } from "@/lib/utils"

export function TokenSelector({
  value,
  onChange,
  balance,
  symbol,
  decimals,
  isNative,
  isLoading = false,
}) {
  const [custom, setCustom] = useState("")
  const [useCustom, setUseCustom] = useState(false)

  const handleSelectChange = (selectedValue) => {
    if (selectedValue === "custom") {
      setUseCustom(true)
      if (custom && isAddress(custom)) {
        onChange({ address: custom, isNative: false })
      }
    } else if (selectedValue === "native") {
      setUseCustom(false)
      onChange({ address: "native", isNative: true })
    } else {
      setUseCustom(false)
      onChange({ address: selectedValue, isNative: false })
    }
  }

  const handleCustomChange = (e) => {
    const addr = e.target.value
    setCustom(addr)
    if (isAddress(addr)) {
      onChange({ address: addr, isNative: false })
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="token-select" className="text-sm font-semibold">
        Select Token
      </Label>
      <div className="flex gap-2">
        <Select
          value={useCustom ? "custom" : value || ""}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger id="token-select" className="flex-1">
            <SelectValue placeholder="Choose token" />
          </SelectTrigger>
          <SelectContent>
            {BASE_TOKENS.map((token) => {
              const imageUrl = getTokenImage(token.address)
              return (
                <SelectItem key={token.address} value={token.address}>
                  <div className="flex items-center gap-2">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={token.symbol}
                        className="h-4 w-4 rounded-full"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none"
                        }}
                      />
                    ) : (
                      <Coins className="h-4 w-4" />
                    )}
                    <span>{token.symbol}</span>
                    <span className="text-muted-foreground">- {token.name}</span>
                  </div>
                </SelectItem>
              )
            })}
            <SelectItem value="custom">Custom ERC20 address</SelectItem>
          </SelectContent>
        </Select>
        {useCustom && (
          <Input
            placeholder="0x..."
            value={custom}
            onChange={handleCustomChange}
            className={cn(
              "flex-1 font-mono text-sm",
              custom && !isAddress(custom) && "border-destructive"
            )}
          />
        )}
      </div>
      {balance !== undefined && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <span className="text-sm text-muted-foreground">
              Balance:{" "}
              <span className="font-semibold text-foreground">
                {formatUnits(balance, decimals || 18)} {symbol || "ETH"}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
