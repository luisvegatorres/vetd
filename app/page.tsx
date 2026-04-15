import Link from "next/link"
import {
  ArrowUpRight,
  Check,
  Compass,
  Globe2,
  House,
  ShieldCheck,
  TrendingUp,
  Utensils,
} from "lucide-react"

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { plans, verticals } from "@/lib/site"

const verticalIcons = {
  Utensils,
  Compass,
  House,
} as const

const homeFaq = [
  {
    q: "¿Cuánto tiempo toma tener mi sitio listo?",
    qEn: "How long until my site is ready?",
    a: "Entre 5 y 7 días después de recibir tu contenido y fotos. Si no tienes contenido todavía, te ayudamos a prepararlo.",
  },
  {
    q: "¿Hay algún contrato a largo plazo?",
    qEn: "Is there a long-term contract?",
    a: "No. Todos nuestros planes son mes a mes. Cancelas cuando quieras, sin penalidades.",
  },
  {
    q: "¿Para qué tipo de negocios trabajan?",
    qEn: "What kind of businesses do you work with?",
    a: "Restaurantes, cafeterías, servicios turísticos, excursiones, Airbnb y rentas vacacionales en todo Puerto Rico.",
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <Section size="lg" className="border-b-0">
        <div className="grid items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-8">
            <Badge
              variant="outline"
              className="rounded-none border-primary/50 bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary"
            >
              Innovate App Studios · Puerto Rico
            </Badge>

            <h1 className="font-heading text-5xl font-normal uppercase leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              Tu negocio,
              <br />
              <span className="text-primary">en la primera página</span>
              <br />
              de Google.
            </h1>
            <p className="max-w-xl text-base uppercase tracking-[0.18em] text-muted-foreground sm:text-lg">
              Your business on the first page of Google.
            </p>

            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Sitios web profesionales, perfil de Google optimizado y SEO bilingüe
              para restaurantes, turismo y Airbnb. Sin contrato, mes a mes.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <WhatsAppButton size="lg" message="Hola, quiero saber más sobre sus planes.">
                Empezar por WhatsApp
              </WhatsAppButton>
              <Link
                href="/servicios"
                className="inline-flex h-14 items-center justify-center gap-2 border border-foreground/30 px-6 text-sm font-medium uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-foreground/5"
              >
                Ver planes
                <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-primary" /> Sin contrato
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-primary" /> Listo en 5–7 días
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-primary" /> Bilingüe
              </span>
            </div>
          </div>

          {/* Hero accent panel */}
          <div className="relative hidden lg:block">
            <div className="aspect-[4/5] w-full bg-card ring-1 ring-border">
              <div className="flex h-full flex-col justify-between p-8">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  / 001 — Resultados que se miden
                </p>
                <div className="space-y-6">
                  <div className="border-t border-border pt-4">
                    <p className="font-heading text-4xl text-primary">+47</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Reseñas en Google · típico a 90 días
                    </p>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="font-heading text-4xl text-primary">12 / mes</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Leads por WhatsApp · cliente activo
                    </p>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="font-heading text-4xl text-primary">#1–3</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Posición en Google Maps local
                    </p>
                  </div>
                </div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
                  San Juan · Ponce · Mayagüez
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Plans */}
      <Section eyebrow="Planes · Plans">
        <div className="mb-12 max-w-2xl">
          <BilingualHeading
            as="h2"
            es="Dos planes. Cero compromisos."
            en="Two plans. Zero commitments."
          />
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Empieza con lo que necesitas hoy. Cambia o cancela cuando quieras —
            todo es mes a mes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={
                "rounded-none gap-4 bg-card ring-1 " +
                (plan.highlight
                  ? "ring-primary"
                  : "ring-border")
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-heading text-2xl uppercase tracking-tight">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="mt-2 uppercase tracking-[0.14em]">
                      {plan.tagline.es}
                    </CardDescription>
                  </div>
                  {plan.highlight ? (
                    <Badge className="rounded-none bg-primary px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-primary-foreground">
                      Recomendado
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-5xl text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {plan.cadence}
                  </span>
                </div>
                <ul className="space-y-3">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f.es} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-sm text-foreground">{f.es}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-3">
                <WhatsAppButton message={plan.ctaMessage}>
                  Empezar — {plan.name}
                </WhatsAppButton>
                <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Sin contrato · No contract
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/servicios"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            Ver todos los detalles <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </Section>

      {/* Verticals */}
      <Section eyebrow="Para quién · Who we serve">
        <div className="mb-12 max-w-2xl">
          <BilingualHeading
            as="h2"
            es="Hecho para tu industria."
            en="Built for your industry."
          />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {verticals.map((v) => {
            const Icon = verticalIcons[v.icon]
            return (
              <Card
                key={v.id}
                className="rounded-none gap-3 bg-card ring-1 ring-border transition-colors hover:ring-primary"
              >
                <CardHeader>
                  <Icon className="size-7 text-primary" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <CardTitle className="font-heading text-lg uppercase tracking-[0.04em]">
                    {v.title.es}
                  </CardTitle>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {v.title.en}
                  </p>
                  <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
                    {v.description.es}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Section>

      {/* Why us */}
      <Section eyebrow="Por qué nosotros · Why us">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <BilingualHeading
            as="h2"
            es="No vendemos diseño bonito. Vendemos clientes nuevos."
            en="We don't sell pretty designs. We sell new customers."
          />
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Globe2,
                title: "Somos locales",
                body: "Conocemos Puerto Rico, el mercado, el idioma, y cómo piensan tus clientes.",
              },
              {
                icon: ShieldCheck,
                title: "Sin contratos",
                body: "Mes a mes, porque confiamos en los resultados que entregamos.",
              },
              {
                icon: TrendingUp,
                title: "Resultados primero",
                body: "Todo se mide en Google: posición, llamadas, leads de WhatsApp.",
              },
            ].map((item) => (
              <div key={item.title} className="space-y-3 border-t border-border pt-6">
                <item.icon className="size-6 text-primary" />
                <h3 className="font-heading text-lg uppercase tracking-[0.04em] text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section eyebrow="Preguntas · FAQ">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <BilingualHeading
            as="h2"
            es="Lo que más nos preguntan."
            en="What people ask first."
          />
          <Accordion>
            {homeFaq.map((item) => (
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

      {/* Closing CTA */}
      <Section size="lg" className="border-b-0 bg-card/40">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <BilingualHeading
            as="h2"
            align="center"
            es="¿Listo para aparecer en Google?"
            en="Ready to show up on Google?"
          />
          <p className="text-base leading-relaxed text-muted-foreground">
            Una sola pregunta por WhatsApp es suficiente para empezar.
            Respondemos el mismo día.
          </p>
          <div className="flex justify-center">
            <WhatsAppButton size="lg">Hablemos por WhatsApp</WhatsAppButton>
          </div>
        </div>
      </Section>
    </>
  )
}
