import {
  Check,
  Compass,
  Globe,
  House,
  MapPin,
  MessageCircle,
  Search,
  Star,
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
import { plans, processSteps, verticals } from "@/lib/site"

const verticalIcons = { Utensils, Compass, House } as const

const deliverables = [
  {
    icon: Globe,
    title: "Tu sitio web",
    titleEn: "Your website",
    body:
      "1 a 4 páginas profesionales: inicio, menú o servicios, sobre el negocio, contacto. Rápido en celular, listo para Google, fácil de actualizar.",
  },
  {
    icon: MapPin,
    title: "Google Business Profile",
    titleEn: "Google Business Profile",
    body:
      "Optimizamos tu perfil en Google Maps: fotos, horarios, categorías, palabras clave. Es lo primero que ven tus clientes — y donde tomamos ventaja.",
  },
  {
    icon: Search,
    title: "SEO en español e inglés",
    titleEn: "Bilingual SEO",
    body:
      "Aparecer cuando buscan en español Y en inglés es doble cliente potencial — esencial en Puerto Rico. Optimizamos cada página para ambos idiomas.",
  },
  {
    icon: MessageCircle,
    title: "Botón de WhatsApp",
    titleEn: "WhatsApp button",
    body:
      "Tu cliente toca un botón y abre WhatsApp con un mensaje listo. Así es como se hace negocio aquí — sin formularios, sin fricción.",
  },
  {
    icon: Star,
    title: "Reseñas automáticas",
    titleEn: "Automated reviews",
    body:
      "Plan Crecimiento. Después de cada cliente, le enviamos un mensaje pidiendo una reseña en Google. Las buenas reseñas se acumulan solas.",
    onlyOn: "Crecimiento",
  },
]

const servicesFaq = [
  {
    q: "¿Qué pasa si cancelo?",
    qEn: "What happens if I cancel?",
    a: "Tu sitio web sale de línea, pero tu Google Business Profile queda contigo — ya está optimizado a tu nombre. Sin penalidades, cancelas con un mensaje.",
  },
  {
    q: "¿Puedo actualizar el menú o las fotos yo mismo?",
    qEn: "Can I update the menu or photos myself?",
    a: "Sí. Te damos acceso para cambiar textos, fotos y precios cuando quieras. Si prefieres que lo hagamos nosotros, también está incluido.",
  },
  {
    q: "¿Incluye el dominio y el hosting?",
    qEn: "Does it include domain and hosting?",
    a: "El hosting está incluido. El dominio (ej: tunegocio.com) es aproximadamente $15/año aparte — te ayudamos a comprarlo y configurarlo.",
  },
  {
    q: "¿Funciona para negocios fuera de Puerto Rico?",
    qEn: "Does it work for businesses outside Puerto Rico?",
    a: "Nos enfocamos en Puerto Rico porque conocemos el mercado. Si estás en otra parte, escríbenos y conversamos — depende del caso.",
  },
  {
    q: "¿Cuánto tiempo toma ver resultados en Google?",
    qEn: "How long until I see results on Google?",
    a: "Google Business Profile empieza a generar tráfico en 2 a 4 semanas. Los resultados de búsqueda orgánica (SEO) toman 2 a 3 meses para asentarse.",
  },
]

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <Section size="md">
        <div className="max-w-3xl space-y-6">
          <Badge
            variant="outline"
            className="rounded-none border-primary/50 bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary"
          >
            Servicios · Services
          </Badge>
          <BilingualHeading
            as="h1"
            es="Todo lo que necesitas para crecer en línea."
            en="Everything you need to grow online."
          />
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Dos planes mensuales pensados para negocios reales en Puerto Rico.
            Sin sorpresas, sin contratos, sin fricción.
          </p>
        </div>
      </Section>

      {/* Plans side by side */}
      <Section eyebrow="Planes · Plans">
        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={
                "rounded-none gap-4 bg-card ring-1 " +
                (plan.highlight ? "ring-primary" : "ring-border")
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-heading text-3xl uppercase tracking-tight">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="mt-2 uppercase tracking-[0.14em]">
                      {plan.tagline.es}
                    </CardDescription>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                      {plan.tagline.en}
                    </p>
                  </div>
                  {plan.highlight ? (
                    <Badge className="rounded-none bg-primary px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-primary-foreground">
                      Recomendado
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline gap-2 border-b border-border pb-6">
                  <span className="font-heading text-6xl text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {plan.cadence}
                  </span>
                </div>
                <ul className="space-y-4">
                  {plan.features.map((f) => (
                    <li key={f.es} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm text-foreground">{f.es}</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground/70">
                          {f.en}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-3 border-t border-border pt-6">
                <WhatsAppButton size="lg" message={plan.ctaMessage}>
                  Empezar — {plan.name}
                </WhatsAppButton>
                <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Sin contrato · No contract · Mes a mes
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Section>

      {/* What's included */}
      <Section eyebrow="Incluido · What's included">
        <div className="mb-12 max-w-2xl">
          <BilingualHeading
            as="h2"
            es="Cada parte explicada."
            en="Every piece explained."
          />
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Sin tecnicismos. Esto es lo que recibes y por qué importa para tu negocio.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {deliverables.map((d) => (
            <Card
              key={d.title}
              className="rounded-none gap-3 bg-card ring-1 ring-border"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <d.icon className="size-7 text-primary" />
                  {d.onlyOn ? (
                    <Badge
                      variant="outline"
                      className="rounded-none border-primary/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-primary"
                    >
                      Solo {d.onlyOn}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <CardTitle className="font-heading text-xl uppercase tracking-[0.04em]">
                  {d.title}
                </CardTitle>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {d.titleEn}
                </p>
                <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
                  {d.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Industries */}
      <Section eyebrow="Industrias · Industries">
        <div className="mb-12 max-w-2xl">
          <BilingualHeading
            as="h2"
            es="Trabajamos con negocios como el tuyo."
            en="We work with businesses like yours."
          />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {verticals.map((v) => {
            const Icon = verticalIcons[v.icon]
            return (
              <Card
                key={v.id}
                className="rounded-none gap-3 bg-card ring-1 ring-border"
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

      {/* How it works */}
      <Section eyebrow="Proceso · How it works">
        <div className="mb-12 max-w-2xl">
          <BilingualHeading
            as="h2"
            es="Tres pasos. Sin complicaciones."
            en="Three steps. No fuss."
          />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {processSteps.slice(0, 3).map((step) => (
            <div
              key={step.number}
              className="space-y-4 border-t-2 border-primary bg-card p-8 ring-1 ring-border"
            >
              <p className="font-heading text-5xl text-primary">{step.number}</p>
              <div>
                <h3 className="font-heading text-xl uppercase tracking-[0.04em] text-foreground">
                  {step.title.es}
                </h3>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                  {step.title.en}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description.es}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section eyebrow="Preguntas · FAQ">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <BilingualHeading
            as="h2"
            es="Lo que querrás saber antes de empezar."
            en="What you'll want to know before starting."
          />
          <Accordion>
            {servicesFaq.map((item) => (
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
            es="¿Tienes preguntas? Escríbenos."
            en="Have questions? Write to us."
          />
          <p className="text-base leading-relaxed text-muted-foreground">
            Respondemos el mismo día. Sin presión, sin compromiso.
          </p>
          <div className="flex justify-center">
            <WhatsAppButton size="lg">Hablar por WhatsApp</WhatsAppButton>
          </div>
        </div>
      </Section>
    </>
  )
}
