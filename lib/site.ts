export const site = {
  name: "Innovate App Studios",
  tagline: {
    es: "Sitios web y presencia en Google para negocios en Puerto Rico.",
    en: "Websites and Google presence for businesses in Puerto Rico.",
  },
  email: "hola@innovateappstudios.com",
  instagram: "innovateappstudios",
  instagramUrl: "https://instagram.com/innovateappstudios",
  location: "Puerto Rico",
  founderName: "Luis Vega Torres",
  founderInitials: "LV",
} as const

export const nav = [
  { href: "/", label: { es: "Inicio", en: "Home" } },
  { href: "/servicios", label: { es: "Servicios", en: "Services" } },
  { href: "/trabajo", label: { es: "Trabajo", en: "Work" } },
  { href: "/nosotros", label: { es: "Nosotros", en: "About" } },
  { href: "/contacto", label: { es: "Contacto", en: "Contact" } },
] as const

export type Plan = {
  id: "presencia" | "crecimiento"
  name: string
  price: string
  cadence: string
  tagline: { es: string; en: string }
  features: { es: string; en: string }[]
  highlight?: boolean
  ctaMessage: string
}

export const plans: Plan[] = [
  {
    id: "presencia",
    name: "Presencia",
    price: "$149",
    cadence: "/mes · /month",
    tagline: {
      es: "Para empezar a aparecer en Google.",
      en: "Start showing up on Google.",
    },
    features: [
      { es: "Sitio web profesional (1–4 páginas)", en: "Professional website (1–4 pages)" },
      { es: "Optimización de Google Business Profile", en: "Google Business Profile optimization" },
      { es: "SEO local en español e inglés", en: "Bilingual local SEO" },
      { es: "Botón de WhatsApp integrado", en: "WhatsApp button integrated" },
      { es: "Hosting y mantenimiento incluido", en: "Hosting & maintenance included" },
    ],
    ctaMessage: "Hola, me interesa el plan Presencia para mi negocio.",
  },
  {
    id: "crecimiento",
    name: "Crecimiento",
    price: "$299",
    cadence: "/mes · /month",
    tagline: {
      es: "Para atraer más clientes cada mes.",
      en: "Bring in more customers every month.",
    },
    features: [
      { es: "Todo lo que incluye Presencia", en: "Everything in Presencia" },
      { es: "Reseñas automáticas en Google", en: "Automated Google reviews" },
      { es: "Reportes mensuales de resultados", en: "Monthly performance reports" },
      { es: "Actualizaciones ilimitadas del sitio", en: "Unlimited site updates" },
      { es: "Soporte prioritario por WhatsApp", en: "Priority WhatsApp support" },
    ],
    highlight: true,
    ctaMessage: "Hola, me interesa el plan Crecimiento para mi negocio.",
  },
]

export type Vertical = {
  id: "restaurantes" | "turismo" | "airbnb"
  title: { es: string; en: string }
  description: { es: string; en: string }
  icon: "Utensils" | "Compass" | "House"
}

export const verticals: Vertical[] = [
  {
    id: "restaurantes",
    title: { es: "Restaurantes y cafeterías", en: "Restaurants & cafés" },
    description: {
      es: "Menús actualizables, reservaciones y reseñas en Google que llenan tus mesas.",
      en: "Live menus, reservations, and Google reviews that fill your tables.",
    },
    icon: "Utensils",
  },
  {
    id: "turismo",
    title: { es: "Turismo y excursiones", en: "Tourism & tours" },
    description: {
      es: "Reservas directas y posicionamiento bilingüe para turistas que ya están buscando.",
      en: "Direct bookings and bilingual ranking for tourists already searching.",
    },
    icon: "Compass",
  },
  {
    id: "airbnb",
    title: { es: "Airbnb y rentas vacacionales", en: "Airbnb & vacation rentals" },
    description: {
      es: "Tu propia página directa — sin comisiones, con reseñas reales y contacto inmediato.",
      en: "Your own direct page — no commissions, real reviews, instant contact.",
    },
    icon: "House",
  },
]

export type Step = {
  number: string
  title: { es: string; en: string }
  description: { es: string; en: string }
}

export const processSteps: Step[] = [
  {
    number: "01",
    title: { es: "Conversación", en: "Conversation" },
    description: {
      es: "Nos contactas por WhatsApp. Entendemos tu negocio. Sin presión.",
      en: "You message us on WhatsApp. We learn about your business. No pressure.",
    },
  },
  {
    number: "02",
    title: { es: "Preparación", en: "Preparation" },
    description: {
      es: "Construimos tu sitio en 5 a 7 días con tu contenido y fotos.",
      en: "We build your site in 5 to 7 days using your content and photos.",
    },
  },
  {
    number: "03",
    title: { es: "Lanzamiento", en: "Launch" },
    description: {
      es: "Tu sitio sale en vivo y dejamos tu Google Business Profile optimizado.",
      en: "Your site goes live and your Google Business Profile is optimized.",
    },
  },
  {
    number: "04",
    title: { es: "Crecimiento", en: "Growth" },
    description: {
      es: "Seguimiento mensual, reportes y ajustes según los resultados.",
      en: "Monthly follow-up, reports, and tweaks based on real results.",
    },
  },
]
