const FALLBACK_NUMBER = "0000000000"

const DEFAULT_MESSAGE =
  "Hola, me interesa saber más sobre sus planes para mi negocio."

export function whatsappNumber(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || FALLBACK_NUMBER
}

export function whatsappHref(message: string = DEFAULT_MESSAGE): string {
  const number = whatsappNumber().replace(/[^\d]/g, "")
  const text = encodeURIComponent(message)
  return `https://wa.me/${number}?text=${text}`
}
