"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, Copy, Share2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PostShareProps = {
  url: string
  title: string
  className?: string
}

export function PostShare({ url, title, className }: PostShareProps) {
  const t = useTranslations("blog")
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(t("linkCopied"))
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error(t("linkCopied"))
    }
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // user cancelled or share unsupported, fall through to copy
      }
    }
    void handleCopy()
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="bg-card text-muted-foreground hover:text-foreground"
      >
        <Share2 className="size-4" />
        {t("share")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="bg-card text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {t("copyLink")}
      </Button>
    </div>
  )
}
