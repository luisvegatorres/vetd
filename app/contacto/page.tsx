"use client"

import * as React from "react"
import { AtSign, Mail, MapPin, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { BilingualHeading } from "@/components/bilingual-heading"
import { Section } from "@/components/section"
import { WhatsAppButton } from "@/components/whatsapp-button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { site } from "@/lib/site"
import { whatsappHref } from "@/lib/whatsapp"

const contactFaq = [
  {
    q: "¿Cuánto tiempo toma tener mi sitio listo?",
    qEn: "How long until my site is ready?",
    a: "Entre 5 y 7 días después de recibir tu contenido.",
  },
  {
    q: "¿Hay contrato?",
    qEn: "Is there a contract?",
    a: "No. Mes a mes — cancelas cuando quieras, sin penalidades.",
  },
]

export default function ContactPage() {
  const [businessType, setBusinessType] = React.useState<string>("")
  const [submitting, setSubmitting] = React.useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    const form = event.currentTarget
    const data = new FormData(form)
    const payload = {
      name: data.get("name"),
      businessType,
      contact: data.get("contact"),
      message: data.get("message"),
    }
    // TODO: wire to Resend / Supabase / serverless function. For launch, log only.
    console.log("[contact-form]", payload)
    await new Promise((r) => setTimeout(r, 350))
    toast.success("¡Recibido! Te contactamos pronto.", {
      description: "Respondemos en menos de 24 horas.",
    })
    form.reset()
    setBusinessType("")
    setSubmitting(false)
  }

  return (
    <>
      {/* Hero */}
      <Section size="md">
        <div className="max-w-3xl space-y-6">
          <Badge
            variant="outline"
            className="rounded-none border-primary/50 bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary"
          >
            Contacto · Contact
          </Badge>
          <BilingualHeading
            as="h1"
            es="Hablemos. Sin compromiso."
            en="Let's talk. No commitment."
          />
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            La mayoría de nuestros clientes empezaron con una sola pregunta por
            WhatsApp. Tú puedes hacer lo mismo.
          </p>
        </div>
      </Section>

      {/* Big WhatsApp + form */}
      <Section eyebrow="Empezar · Get started">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* WhatsApp panel */}
          <div className="flex flex-col justify-between gap-8 border-t-2 border-primary bg-card p-8 ring-1 ring-border">
            <div className="space-y-4">
              <MessageCircle className="size-10 text-primary" />
              <h2 className="font-heading text-3xl uppercase tracking-tight text-foreground">
                WhatsApp
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                La forma más rápida. Un toque y empezamos a conversar — sin
                formularios, sin esperar.
              </p>
            </div>
            <div className="space-y-3">
              <WhatsAppButton
                size="lg"
                className="w-full"
                message="Hola, me interesa saber más sobre sus planes para mi negocio."
              >
                Abrir WhatsApp
              </WhatsAppButton>
              <p className="text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Respondemos en menos de 24 horas — normalmente el mismo día.
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="border-t-2 border-border bg-card p-8 ring-1 ring-border"
          >
            <div className="mb-6 space-y-2">
              <h2 className="font-heading text-3xl uppercase tracking-tight text-foreground">
                Por correo
              </h2>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Prefieres email · Email instead
              </p>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel
                  htmlFor="name"
                  className="text-xs uppercase tracking-[0.18em]"
                >
                  Nombre · Name
                </FieldLabel>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="María Rodríguez"
                  className="rounded-none h-11"
                />
              </Field>

              <Field>
                <FieldLabel className="text-xs uppercase tracking-[0.18em]">
                  Tipo de negocio · Business type
                </FieldLabel>
                <Select
                  value={businessType}
                  onValueChange={(v) => setBusinessType(v as string)}
                >
                  <SelectTrigger className="rounded-none h-11 w-full">
                    <SelectValue placeholder="Selecciona uno" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="restaurante">
                      Restaurante / cafetería
                    </SelectItem>
                    <SelectItem value="turismo">Turismo / excursión</SelectItem>
                    <SelectItem value="airbnb">Airbnb / renta vacacional</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="contact"
                  className="text-xs uppercase tracking-[0.18em]"
                >
                  WhatsApp o Email
                </FieldLabel>
                <Input
                  id="contact"
                  name="contact"
                  required
                  placeholder="787-555-1234 · maria@ejemplo.com"
                  className="rounded-none h-11"
                />
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="message"
                  className="text-xs uppercase tracking-[0.18em]"
                >
                  ¿Qué necesitas? · What do you need? (opcional)
                </FieldLabel>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Cuéntanos en una línea — o déjalo en blanco."
                  rows={3}
                  className="rounded-none"
                />
              </Field>

              <Button
                type="submit"
                disabled={submitting}
                className="h-12 w-full rounded-none bg-foreground uppercase tracking-[0.18em] text-background hover:bg-foreground/85"
              >
                {submitting ? "Enviando…" : "Enviar mensaje"}
              </Button>
            </FieldGroup>
          </form>
        </div>
      </Section>

      {/* Alternative contacts */}
      <Section eyebrow="Otras vías · Other ways">
        <div className="grid gap-2 text-sm">
          <ContactRow
            icon={MessageCircle}
            label="WhatsApp"
            href={whatsappHref()}
            value="Chat directo"
          />
          <ContactRow
            icon={Mail}
            label="Email"
            href={`mailto:${site.email}`}
            value={site.email}
          />
          <ContactRow
            icon={AtSign}
            label="Instagram"
            href={site.instagramUrl}
            value={`@${site.instagram}`}
          />
          <ContactRow
            icon={MapPin}
            label="Ubicación · Location"
            value={site.location}
          />
        </div>
      </Section>

      {/* Mini FAQ */}
      <Section eyebrow="Antes de escribir · Before you write">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <BilingualHeading
            as="h2"
            es="Las dos preguntas más frecuentes."
            en="The two most common questions."
          />
          <Accordion>
            {contactFaq.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-left text-base uppercase tracking-[0.04em]">
                  <span>
                    {item.q}
                    <span className="ml-2 hidden text-xs font-normal uppercase tracking-[0.18em] text-muted-foreground sm:inline">
                      / {item.qEn}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* Coverage */}
      <Section size="sm" className="border-b-0">
        <p className="mx-auto max-w-3xl text-center font-heading text-2xl uppercase leading-tight tracking-tight text-foreground sm:text-3xl">
          Atendemos negocios en todo Puerto Rico —{" "}
          <span className="text-primary">San Juan, Ponce, Mayagüez,</span> y
          más.
        </p>
      </Section>
    </>
  )
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  href?: string
}) {
  const content = (
    <>
      <span className="inline-flex items-center gap-3">
        <Icon className="size-4 text-primary" />
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </>
  )

  const baseClass =
    "flex items-center justify-between gap-6 border-b border-border py-4 transition-colors"

  if (!href) {
    return <div className={baseClass}>{content}</div>
  }

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`${baseClass} hover:text-primary`}
    >
      {content}
    </a>
  )
}
