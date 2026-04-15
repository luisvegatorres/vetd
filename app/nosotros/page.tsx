import { Globe2, Heart, LineChart, Shield, ShieldCheck, TrendingUp } from "lucide-react"

import { BilingualHeading } from "@/components/bilingual-heading"
import { Section } from "@/components/section"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { processSteps, site, verticals } from "@/lib/site"

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <Section size="md">
        <div className="max-w-3xl space-y-6">
          <Badge
            variant="outline"
            className="rounded-none border-primary/50 bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary"
          >
            Nosotros · About
          </Badge>
          <BilingualHeading
            as="h1"
            es="Somos de aquí. Entendemos tu negocio."
            en="We're from here. We understand your business."
          />
        </div>
      </Section>

      {/* Founder */}
      <Section eyebrow="Fundador · Founder">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:items-start">
          <div className="aspect-square w-full max-w-sm bg-card ring-1 ring-border">
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <div className="flex size-32 items-center justify-center bg-primary/15 ring-1 ring-primary/30">
                <span className="font-heading text-5xl text-primary">
                  {site.founderInitials}
                </span>
              </div>
              <div className="text-center">
                <p className="font-heading text-lg uppercase tracking-[0.04em] text-foreground">
                  {site.founderName}
                </p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Fundador · Founder
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <p className="font-heading text-2xl leading-tight text-foreground sm:text-3xl">
              &ldquo;Vi cómo negocios increíbles en Puerto Rico perdían clientes
              porque no aparecían en Google. Decidí hacer algo al respecto.&rdquo;
            </p>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                Soy de aquí. He caminado dentro de los restaurantes, hablado con
                los dueños de excursiones, ayudado a anfitriones de Airbnb. El
                problema siempre es el mismo: tienen un negocio bueno y nadie los
                encuentra en línea.
              </p>
              <p>
                Innovate App Studios no es una agencia remota mandando templates
                desde otro país. Es una persona local que vive aquí, contesta su
                propio WhatsApp, y construye cada sitio con la misma atención que
                pondría si fuera para su propia familia.
              </p>
              <p>
                Sin contratos. Sin sorpresas. Resultados que se miden en Google.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Why us */}
      <Section eyebrow="Por qué Innovate · Why Innovate">
        <div className="mb-12 max-w-2xl">
          <BilingualHeading
            as="h2"
            es="Tres razones simples."
            en="Three simple reasons."
          />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Globe2,
              title: "Somos locales",
              titleEn: "We're local",
              body: "Conocemos Puerto Rico, el mercado, el idioma, y cómo piensan tus clientes. Esa diferencia se nota en cada palabra del sitio.",
            },
            {
              icon: ShieldCheck,
              title: "Sin contratos",
              titleEn: "No contracts",
              body: "Mes a mes, porque confiamos en los resultados. Si no funciona, te vas sin penalidades. Esa es la regla.",
            },
            {
              icon: TrendingUp,
              title: "Resultados primero",
              titleEn: "Results first",
              body: "No te vendemos diseño bonito. Te vendemos clientes nuevos — medidos en Google, en reseñas, y en mensajes de WhatsApp.",
            },
          ].map((r) => (
            <Card
              key={r.title}
              className="rounded-none gap-3 bg-card ring-1 ring-border"
            >
              <CardHeader>
                <r.icon className="size-7 text-primary" />
              </CardHeader>
              <CardContent className="space-y-2">
                <CardTitle className="font-heading text-lg uppercase tracking-[0.04em]">
                  {r.title}
                </CardTitle>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {r.titleEn}
                </p>
                <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
                  {r.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section eyebrow="Proceso · How we work">
        <div className="mb-12 max-w-2xl">
          <BilingualHeading
            as="h2"
            es="Sin misterios. Así trabajamos."
            en="No mystery. Here's how it goes."
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step) => (
            <div
              key={step.number}
              className="space-y-3 border-t-2 border-primary bg-card p-6 ring-1 ring-border"
            >
              <p className="font-heading text-4xl text-primary">{step.number}</p>
              <h3 className="font-heading text-base uppercase tracking-[0.06em] text-foreground">
                {step.title.es}
              </h3>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
                {step.title.en}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description.es}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Who we serve */}
      <Section eyebrow="Para quién · Who we serve">
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <BilingualHeading
            as="h2"
            es="Tres industrias que conocemos a fondo."
            en="Three industries we know inside out."
          />
          <ul className="space-y-4">
            {verticals.map((v) => (
              <li
                key={v.id}
                className="flex items-baseline justify-between gap-6 border-b border-border pb-4"
              >
                <div>
                  <p className="font-heading text-lg uppercase tracking-[0.04em] text-foreground">
                    {v.title.es}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                    {v.title.en}
                  </p>
                </div>
                <span className="font-heading text-2xl text-primary">/0{verticals.indexOf(v) + 1}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Values */}
      <Section eyebrow="Valores · Values">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Heart,
              title: "Honestidad",
              titleEn: "Honesty",
              body: "Si tu negocio no está listo para un sitio, te lo decimos. Preferimos perder un cliente hoy que defraudar a uno mañana.",
            },
            {
              icon: LineChart,
              title: "Resultados medibles",
              titleEn: "Measurable results",
              body: "Todo lo que hacemos se puede medir en Google: posición, tráfico, llamadas, mensajes. Si no se puede medir, no lo prometemos.",
            },
            {
              icon: Shield,
              title: "Relación a largo plazo",
              titleEn: "Long-term relationship",
              body: "No somos un proyecto que entregamos y desaparecemos. Somos tu equipo digital — disponible cada mes que estés con nosotros.",
            },
          ].map((v) => (
            <div
              key={v.title}
              className="space-y-3 border-t border-border pt-6"
            >
              <v.icon className="size-6 text-primary" />
              <h3 className="font-heading text-lg uppercase tracking-[0.04em] text-foreground">
                {v.title}
              </h3>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                {v.titleEn}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Closing CTA */}
      <Section size="lg" className="border-b-0 bg-card/40">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <BilingualHeading
            as="h2"
            align="center"
            es="¿Tienes preguntas antes de empezar? Escríbeme directamente."
            en="Have questions before starting? Write to me directly."
          />
          <div className="flex justify-center">
            <WhatsAppButton size="lg" message="Hola Luis, tengo unas preguntas antes de empezar.">
              Escribir por WhatsApp
            </WhatsAppButton>
          </div>
        </div>
      </Section>
    </>
  )
}
