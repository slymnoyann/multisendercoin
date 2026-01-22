"use client"

import { useState, useEffect } from "react"
import { isAddress } from "viem"
import { Copy, CheckCircle2, XCircle, BookOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/use-toast"
import { formatAddress, copyAddress, getAddressBook, saveToAddressBook } from "@/lib/addressUtils"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AddressInput({
  value,
  onChange,
  placeholder = "Recipient address (0x...)",
  className,
  showAddressBook = true,
}) {
  const [copied, setCopied] = useState(false)
  const [addressBook, setAddressBook] = useState([])
  const { toast } = useToast()
  const isValid = value ? isAddress(value) : true

  useEffect(() => {
    if (showAddressBook) {
      setAddressBook(getAddressBook())
    }
  }, [showAddressBook])

  const handleCopy = async () => {
    if (value && isValid) {
      const success = await copyAddress(value)
      if (success) {
        setCopied(true)
        toast({
          title: "Copied!",
          description: "Address copied to clipboard",
          variant: "success",
        })
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const handleAddressBookSelect = (address) => {
    onChange(address)
  }

  const handleSaveToBook = () => {
    if (value && isValid) {
      const label = prompt("Enter a label for this address:")
      if (label) {
        saveToAddressBook(value, label)
        setAddressBook(getAddressBook())
        toast({
          title: "Saved!",
          description: "Address saved to address book",
          variant: "success",
        })
      }
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "font-mono text-sm pr-20",
            !isValid && value && "border-destructive focus-visible:ring-destructive"
          )}
          aria-invalid={!isValid && value !== ""}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <>
              {isValid ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              {isValid && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopy}
                  >
                    <Copy className={cn("h-3 w-3", copied && "text-green-500")} />
                  </Button>
                  {showAddressBook && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleSaveToBook}
                    >
                      <BookOpen className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      {showAddressBook && addressBook.length > 0 && (
        <Select onValueChange={handleAddressBookSelect}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select from address book" />
          </SelectTrigger>
          <SelectContent>
            {addressBook.map((entry) => (
              <SelectItem key={entry.address} value={entry.address}>
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{entry.label}</span>
                  <span className="text-xs text-muted-foreground font-mono ml-2">
                    {formatAddress(entry.address)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
