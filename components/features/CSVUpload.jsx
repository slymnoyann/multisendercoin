"use client"

import { useState, useCallback } from "react"
import { Upload, Download, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { parseCSVRecipients, validateCSVRecipients, generateCSVTemplate } from "@/lib/csvParser"
import { useToast } from "@/lib/use-toast"
import { cn } from "@/lib/utils"

export function CSVUpload({ mode, onSuccess, onClose }) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleCSVUpload = useCallback(
    async (file) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Please select a CSV file")
        return
      }

      try {
        const text = await file.text()
        const parsed = parseCSVRecipients(text, true, mode === "custom")
        const validation = validateCSVRecipients(parsed, mode === "custom")

        if (!validation.isValid) {
          setError(validation.errors.slice(0, 5).join("\n"))
          toast({
            title: "Validation Error",
            description: "Please check your CSV format",
            variant: "destructive",
          })
          return
        }

        onSuccess(validation.validRecipients)
        setError("")
      } catch (error) {
        setError("Failed to parse CSV file. Please check the format.")
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        })
      }
    },
    [mode, onSuccess, toast]
  )

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleCSVUpload(e.dataTransfer.files[0])
      }
    },
    [handleCSVUpload]
  )

  const handleFileInput = useCallback(
    (e) => {
      if (e.target.files && e.target.files[0]) {
        handleCSVUpload(e.target.files[0])
      }
    },
    [handleCSVUpload]
  )

  const downloadTemplate = useCallback(() => {
    const csv = generateCSVTemplate(mode === "custom", true)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "recipients-template.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Downloaded",
      description: "Template downloaded successfully",
      variant: "success",
    })
  }, [mode, toast])

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Recipients</DialogTitle>
          <DialogDescription>
            Upload a CSV file with recipient addresses
            {mode === "custom" ? " and amounts" : ""}. The file should{" "}
            {mode === "custom"
              ? "have headers: address,amount"
              : "have a header: address"}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/20"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 text-sm font-medium">
              Drag and drop your CSV file here
            </p>
            <p className="text-xs text-muted-foreground">or</p>
            <label className="mt-2 cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <span>Choose File</span>
              </Button>
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={downloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">Error:</p>
              <pre className="mt-1 text-xs text-destructive whitespace-pre-wrap">
                {error}
              </pre>
            </div>
          )}

          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">CSV Format:</p>
                <code className="block rounded bg-background p-2 text-xs font-mono">
                  {mode === "custom"
                    ? "address,amount\n0x742d35Cc6634C0532925a3b844Bc454e4438f44e,1.5"
                    : "address\n0x742d35Cc6634C0532925a3b844Bc454e4438f44e"}
                </code>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
