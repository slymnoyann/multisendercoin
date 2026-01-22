"use client"

import { Equal, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function ModeToggle({ mode, onChange }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Distribution Mode</Label>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant={mode === "equal" ? "default" : "outline"}
          className={cn(
            "h-auto flex-col gap-2 py-4",
            mode === "equal" && "bg-primary text-primary-foreground"
          )}
          onClick={() => onChange("equal")}
        >
          <Equal className="h-5 w-5" />
          <span>Equal Amounts</span>
        </Button>
        <Button
          type="button"
          variant={mode === "custom" ? "default" : "outline"}
          className={cn(
            "h-auto flex-col gap-2 py-4",
            mode === "custom" && "bg-primary text-primary-foreground"
          )}
          onClick={() => onChange("custom")}
        >
          <DollarSign className="h-5 w-5" />
          <span>Custom Amounts</span>
        </Button>
      </div>
    </div>
  )
}
