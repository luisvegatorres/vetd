const FALLBACK_NUMBER = ""

const DEFAULT_MESSAGE =
  "Hi, I'd like to start a project with Innovate App Studios."

export function whatsappNumber(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || FALLBACK_NUMBER
}

export function whatsappDisplay(): string {
  return (
    process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    "[your number]"
  )
}

export function whatsappHref(message: string = DEFAULT_MESSAGE): string {
  const number = whatsappNumber().replace(/[^\d]/g, "")
  if (!number) {
    return "#"
  }
  const text = encodeURIComponent(message)
  return `https://wa.me/${number}?text=${text}`
}
