import * as React from "react"
import { MessageCircle } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
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
  const href = whatsappHref(message)
  const isLarge = size === "lg"
  const sharedVariant = variant === "primary" ? "default" : "outline"
  const sharedSize = isLarge ? "lg" : "default"

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      data-slot="whatsapp-button"
      className={cn(
        buttonVariants({ variant: sharedVariant, size: sharedSize }),
        "tracking-wider uppercase",
        className
      )}
    >
      <MessageCircle className={cn(isLarge ? "size-5" : "size-4")} />
      <span>{children ?? "WhatsApp"}</span>
    </a>
  )
}
