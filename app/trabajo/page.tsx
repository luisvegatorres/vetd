import { ArrowUpRight, Compass, House, Quote, Utensils } from "lucide-react"

import { BilingualHeading } from "@/components/bilingual-heading"
import { Section } from "@/components/section"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const cases = [
  {
    name: "El Rincón de María",
    industry: "Restaurante",
    industryEn: "Restaurant",
    location: "Ponce",
    plan: "Crecimiento",
    icon: Utensils,
    accent: "from-primary/15",
    before: [
      "Sin sitio web propio",
      "Fuera de Google Maps",
      "0 reseñas digitales",
    ],
    after: [
      "Posición #3 — 'restaurante en Ponce'",
      "47 reseñas en Google (4.8★)",
      "12 leads de WhatsApp al mes",
    ],
  },
  {
    name: "Boquerón Eco Tours",
    industry: "Turismo",
    industryEn: "Tourism",
    location: "Cabo Rojo",
    plan: "Crecimiento",
    icon: Compass,
    accent: "from-primary/15",
    before: [
      "Solo Instagram, sin reservaciones directas",
      "Comisiones altas en plataformas terceras",
      "Tráfico orgánico mínimo en inglés",
    ],
    after: [
      "Top 5 — 'tours en kayak Puerto Rico'",
      "Reservaciones directas, 0% comisión",
      "60% del tráfico viene en inglés",
    ],
  },
  {
    name: "Casa Marina Vieques",
    industry: "Airbnb",
    industryEn: "Vacation rental",
    location: "Vieques",
    plan: "Presencia",
    icon: House,
    accent: "from-primary/15",
    before: [
      "Solo en Airbnb, sujeto al algoritmo",
      "Sin sitio propio para repetidores",
      "Comunicación lenta vía plataforma",
    ],
    after: [
      "Página directa con calendario en vivo",
      "30% de huéspedes vuelven directamente",
      "Contacto inmediato por WhatsApp",
    ],
  },
] as const

export default function WorkPage() {
  return (
    <>
      {/* Hero */}
      <Section size="md">
        <div className="max-w-3xl space-y-6">
          <Badge
            variant="outline"
            className="rounded-none border-primary/50 bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary"
          >
            Trabajo · Work
          </Badge>
          <BilingualHeading
            as="h1"
            es="Resultados reales para negocios reales en Puerto Rico."
            en="Real results for real businesses in Puerto Rico."
          />
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Nuestro portafolio no es solo diseño — es posiciones en Google y leads
            de WhatsApp. Esto es lo que estamos construyendo.
          </p>
        </div>
      </Section>

      {/* Case studies */}
      <Section eyebrow="Casos de estudio · Case studies">
        <div className="mb-12 flex items-end justify-between gap-6">
          <BilingualHeading
            as="h2"
            es="Tres negocios. Tres verticales."
            en="Three businesses. Three verticals."
          />
          <Badge
            variant="outline"
            className="rounded-none border-primary/40 bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary"
          >
            Demos
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {cases.map((c) => (
            <Card
              key={c.name}
              className="rounded-none gap-0 bg-card ring-1 ring-border"
            >
              {/* Visual mockup band */}
              <div
                className={`relative aspect-[5/3] w-full bg-gradient-to-br ${c.accent} via-card to-card`}
              >
                <div className="absolute inset-0 flex flex-col justify-between p-5">
                  <div className="flex items-center gap-2">
                    <span className="size-2 bg-foreground/30" />
                    <span className="size-2 bg-foreground/30" />
                    <span className="size-2 bg-foreground/30" />
                    <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {c.name.toLowerCase().replace(/\s+/g, "")}.com
                    </span>
                  </div>
                  <c.icon className="size-12 text-primary/70" />
                  <div className="space-y-1">
                    <p className="font-heading text-lg uppercase tracking-tight text-foreground">
                      {c.name}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {c.location} · {c.industry}
                    </p>
                  </div>
                </div>
              </div>

              <CardHeader className="border-t border-border pt-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="rounded-none bg-foreground/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-foreground">
                      {c.industry}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-none border-primary/40 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-primary"
                    >
                      {c.plan}
                    </Badge>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-none border-foreground/30 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Demo
                  </Badge>
                </div>
                <CardTitle className="mt-4 font-heading text-xl uppercase tracking-[0.04em]">
                  {c.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
                    Antes · Before
                  </p>
                  <ul className="space-y-1.5">
                    {c.before.map((b) => (
                      <li
                        key={b}
                        className="text-sm leading-snug text-muted-foreground"
                      >
                        — {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-primary">
                    Después · After
                  </p>
                  <ul className="space-y-1.5">
                    {c.after.map((a) => (
                      <li key={a} className="text-sm leading-snug text-foreground">
                        ✓ {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
                >
                  Ver demo <ArrowUpRight className="size-3.5" />
                </button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Section>

      {/* Numbers */}
      <Section eyebrow="En números · By the numbers">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { stat: "3", label: "sitios demo activos · active demo sites" },
            { stat: "100%", label: "optimizados para Google · Google-ready" },
            { stat: "Abril 2026", label: "fecha de lanzamiento · launch date" },
          ].map((n) => (
            <div
              key={n.label}
              className="border-t-2 border-primary bg-card p-8 ring-1 ring-border"
            >
              <p className="font-heading text-5xl text-primary sm:text-6xl">
                {n.stat}
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {n.label}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* This site as proof */}
      <Section eyebrow="Esta es la demo · This is the demo">
        <div className="grid items-center gap-12 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <BilingualHeading
              as="h2"
              es="Este sitio que estás viendo — así quedará el tuyo."
              en="This site you're looking at — yours will look like this."
            />
            <p className="text-base leading-relaxed text-muted-foreground">
              Rápido, claro, optimizado para Google, listo para celular y
              traducido al inglés. Si te gusta cómo se siente este sitio, así
              entregamos cada proyecto.
            </p>
            <WhatsAppButton size="lg">Quiero uno así</WhatsAppButton>
          </div>
          <div className="hidden bg-card p-6 ring-1 ring-border lg:block">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Tu sitio incluirá
            </p>
            <ul className="mt-4 space-y-3 text-sm text-foreground">
              <li>— Diseño hecho a medida</li>
              <li>— Hosting incluido</li>
              <li>— SSL y dominio propio</li>
              <li>— Bilingüe es / en</li>
              <li>— Botón WhatsApp</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Testimonials placeholder */}
      <Section eyebrow="Testimonios · Testimonials">
        <Card className="rounded-none gap-4 bg-card p-12 ring-1 ring-border">
          <Quote className="size-10 text-primary/50" />
          <CardContent className="space-y-4 px-0">
            <p className="font-heading text-2xl uppercase leading-tight tracking-tight text-foreground sm:text-3xl">
              Próximamente: testimonios de nuestros primeros clientes.
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Coming soon: testimonials from our first clients.
            </p>
            <p className="max-w-2xl pt-4 text-sm leading-relaxed text-muted-foreground">
              Estamos lanzando con clientes nuevos en Puerto Rico. Cuando alcancen
              90 días en Google, sus historias completas vivirán aquí — con números
              reales, capturas de Google y palabras directas de los dueños.
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* Closing CTA */}
      <Section size="lg" className="border-b-0 bg-card/40">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <BilingualHeading
            as="h2"
            align="center"
            es="¿Quieres un sitio así para tu negocio?"
            en="Want a site like this for your business?"
          />
          <div className="flex justify-center">
            <WhatsAppButton size="lg">Empezar por WhatsApp</WhatsAppButton>
          </div>
        </div>
      </Section>
    </>
  )
}
