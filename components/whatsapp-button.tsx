import * as React from "react"
import { MessageCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { whatsappHref } from "@/lib/whatsapp"

type WhatsAppButtonProps = {
  message?: string
  size?: "default" | "lg"
  variant?: "primary" | "ghost"
  className?: string
  children?: React.ReactNode
}

export function WhatsAppButton({
  message,
  size = "default",
  variant = "primary",
  className,
  children,
}: WhatsAppButtonProps) {
  const isLarge = size === "lg"
  const dims = isLarge ? "h-14 px-8 text-base" : "h-11 px-5 text-sm"
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/85"
      : "bg-transparent text-foreground border border-foreground/40 hover:bg-foreground/10"

  return (
    <a
      href={whatsappHref(message)}
      target="_blank"
      rel="noopener noreferrer"
      data-slot="whatsapp-button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-none font-medium uppercase tracking-[0.14em] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        dims,
        styles,
        className
      )}
    >
      <MessageCircle className={cn(isLarge ? "size-5" : "size-4")} />
      <span>{children ?? "WhatsApp"}</span>
    </a>
  )
}
