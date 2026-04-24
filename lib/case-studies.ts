import type { BrandName } from "@/components/brand/brand-icons"
import type { Locale } from "@/i18n/routing"

export type Metric = { label: string; value: string }
export type TechItem = { name: BrandName; role: string }
export type Beat = { title: string; body: string }
export type Figure = { caption: string; initials?: string }

export type CaseStudy = {
  slug: string
  title: string
  category: string
  tagline: string
  year: string
  duration: string
  role: string
  liveUrl?: string
  overview: string
  leadFigure: Figure
  problem: Beat[]
  problemIntro: string
  pullQuote: string
  solution: Beat[]
  solutionIntro: string
  midFigure: Figure
  stack: TechItem[]
  features: string[]
  metrics: Metric[]
}

const caseStudiesEn: Record<string, CaseStudy> = {
  "innovate-app-studios": {
    slug: "innovate-app-studios",
    title: "Innovate App Studios CRM",
    category: "SaaS Products",
    tagline:
      "Process notes on building a typed, server-first CRM end-to-end.",
    year: "2026",
    duration: "Ongoing",
    role: "Design, build, ship",
    overview:
      "We built the studio on Next.js 16, server-first by default, typed end-to-end from the Postgres schema to the UI. This is a walkthrough of the stack, the decisions that shaped the codebase, and the process we used to get from empty repo to running system, without stacking services we didn't understand.",
    leadFigure: {
      caption:
        "Route groups: marketing site and protected app, one codebase, one deployment.",
      initials: "RG",
    },
    problemIntro:
      "Four constraints shaped every technical decision. We wrote them down before the repo existed and pulled them back out whenever a choice got noisy.",
    problem: [
      {
        title: "End-to-end type safety, no manual sync",
        body: "If the database schema changes, TypeScript should complain before the browser does. That ruled out any layer that accepts untyped payloads and any client that hand-writes types for server responses. The schema is the contract.",
      },
      {
        title: "Server-first by default",
        body: "Most pages shouldn't ship JavaScript for content that doesn't need it. React Server Components had to be the default rendering mode, not an opt-in optimization we'd sprinkle in later. Client components exist where interaction actually lives.",
      },
      {
        title: "One codebase, one deployment",
        body: "Public marketing site and protected app live side-by-side. Route groups handle the split; a single build pipeline ships both. No microservices, no split repos, no shared packages to keep in lockstep, until something earns the split.",
      },
      {
        title: "Maintainable by one developer",
        body: "Every abstraction had to pull its weight. No state management library until server actions hit a wall. No ORM when generated types already covered it. No framework we didn't already know well enough to debug at 2am.",
      },
    ],
    pullQuote:
      "If the schema changes, TypeScript complains before the browser does.",
    solutionIntro:
      "Five decisions that shaped the codebase. Each one a place where we picked the boring, well-typed option and moved on.",
    solution: [
      {
        title: "Next.js 16 App Router, RSC-first",
        body: "Server Components render by default; client components are the opt-in. Pages read from the database in their own body via async functions. No data-fetching library, no hydration dance for static content. Mutations go through server actions, which revalidate by tag or path and let affected routes re-render themselves.",
      },
      {
        title: "Three Supabase clients, different doors",
        body: "A browser client for client components, a server client bound to next/headers cookies for RSC and server actions, a middleware client for request-scoped cookie refresh, and a service-role admin client marked 'server-only' so it can't be imported from a client file. Each has a single purpose; picking the wrong one is a type error, not a runtime bug.",
      },
      {
        title: "Generated types, never hand-written",
        body: "Supabase's CLI generates TypeScript from the live schema into lib/supabase/types.ts. Every query, every mutation, every component imports from that file. A column rename breaks the build across every consumer at once. No drift, no stale fixtures, no guess-and-check.",
      },
      {
        title: "shadcn + Tailwind v4 as the only UI layer",
        body: "We vendor shadcn components into the repo and edit them directly. Tailwind v4 tokens live in CSS variables (OKLCH) so the design system is themable without rebuilds. No CSS-in-JS, no component library dependency, no runtime style resolution. One PR changes the primary color across the entire app.",
      },
      {
        title: "Vercel Fluid Compute over serverless",
        body: "Fluid Compute keeps warm instances across requests, so middleware auth and server-rendered pages don't pay cold-start costs the way classic serverless would. Fresh Supabase clients per request (no module-level singletons) means concurrent request isolation still holds up.",
      },
    ],
    midFigure: {
      caption:
        "Type pipeline: Postgres migrations → Supabase CLI → generated TS → imported everywhere.",
      initials: "TS",
    },
    stack: [
      { name: "Next.js", role: "App Router, server actions, middleware auth" },
      { name: "React", role: "RSC-first, Suspense, streaming" },
      { name: "TypeScript", role: "Strict mode, generated Supabase types" },
      { name: "Tailwind CSS", role: "OKLCH tokens, dark-canonical theming" },
      { name: "shadcn/ui", role: "Vendored primitives, edited in-repo" },
      { name: "Supabase", role: "Postgres, Auth, RLS, SSR cookie plumbing" },
      { name: "Stripe", role: "Hosted Checkout + idempotent webhooks" },
      { name: "Cal.com", role: "HMAC-signed booking webhooks" },
      { name: "Vercel", role: "Fluid Compute, edge hosting, image optimization" },
    ],
    features: [
      "Proxy middleware that refreshes Supabase sessions on every request",
      "Three single-purpose Supabase clients (browser, server, admin) with 'server-only' guards",
      "Generated Postgres types imported across every query and form",
      "Server actions for every mutation, revalidated by tag or path",
      "Shared shadcn + Tailwind design system across marketing and app",
      "Route groups splitting public marketing and protected CRM, one build",
      "React 19 streaming with Suspense boundaries on the slow data paths",
      "Dark-canonical OKLCH tokens in CSS variables, themable without rebuilds",
    ],
    metrics: [
      { label: "Core tables", value: "10" },
      { label: "Migrations shipped", value: "35+" },
      { label: "Runtime deps", value: "< 40" },
      { label: "Monthly tooling", value: "$0" },
    ],
  },
}

const caseStudiesEs: Record<string, CaseStudy> = {
  "innovate-app-studios": {
    slug: "innovate-app-studios",
    title: "CRM de Innovate App Studios",
    category: "Productos SaaS",
    tagline:
      "Notas del proceso para construir un CRM tipado y server-first de extremo a extremo.",
    year: "2026",
    duration: "En curso",
    role: "Diseño, construcción, lanzamiento",
    overview:
      "Construimos el estudio sobre Next.js 16, server-first por defecto, tipado de extremo a extremo desde el esquema de Postgres hasta la UI. Este es un recorrido del stack, las decisiones que dieron forma al código y el proceso que usamos para pasar de un repo vacío a un sistema funcionando, sin acumular servicios que no entendíamos.",
    leadFigure: {
      caption:
        "Route groups: sitio de marketing y app protegida, un solo código, un solo despliegue.",
      initials: "RG",
    },
    problemIntro:
      "Cuatro restricciones moldearon cada decisión técnica. Las escribimos antes de que existiera el repo y las sacábamos cuando una decisión se ponía ruidosa.",
    problem: [
      {
        title: "Type safety de extremo a extremo, sin sincronización manual",
        body: "Si el esquema de la base de datos cambia, TypeScript debe quejarse antes que el navegador. Eso descartó cualquier capa que aceptara payloads sin tipar y cualquier cliente que escribiera tipos a mano para respuestas del servidor. El esquema es el contrato.",
      },
      {
        title: "Server-first por defecto",
        body: "La mayoría de las páginas no deberían enviar JavaScript para contenido que no lo necesita. React Server Components tenía que ser el modo de renderizado por defecto, no una optimización opcional que rociaríamos después. Los componentes de cliente existen donde realmente vive la interacción.",
      },
      {
        title: "Un solo código, un solo despliegue",
        body: "El sitio público de marketing y la app protegida viven lado a lado. Los route groups manejan la división; un solo pipeline de build entrega ambos. Sin microservicios, sin repos divididos, sin paquetes compartidos que mantener sincronizados, hasta que algo se gane la división.",
      },
      {
        title: "Mantenible por un solo desarrollador",
        body: "Cada abstracción tenía que ganarse su peso. Sin librería de manejo de estado hasta que las server actions tocaran techo. Sin ORM cuando los tipos generados ya lo cubrían. Sin framework que no conociéramos lo suficiente como para depurar a las 2 AM.",
      },
    ],
    pullQuote:
      "Si el esquema cambia, TypeScript se queja antes que el navegador.",
    solutionIntro:
      "Cinco decisiones que moldearon el código. Cada una un lugar donde elegimos la opción aburrida y bien tipada y seguimos adelante.",
    solution: [
      {
        title: "Next.js 16 App Router, RSC-first",
        body: "Los Server Components renderizan por defecto; los componentes de cliente son la excepción. Las páginas leen de la base de datos en su propio cuerpo vía funciones async. Sin librería de fetching, sin baile de hidratación para contenido estático. Las mutaciones pasan por server actions, que revalidan por tag o path y dejan que las rutas afectadas se re-rendericen solas.",
      },
      {
        title: "Tres clientes Supabase, distintas puertas",
        body: "Un cliente de navegador para componentes de cliente, un cliente de servidor enlazado a las cookies de next/headers para RSC y server actions, un cliente de middleware para refrescar cookies por request, y un cliente admin con service role marcado 'server-only' para que no se importe desde un archivo de cliente. Cada uno tiene un solo propósito; elegir el equivocado es un error de tipo, no un bug en runtime.",
      },
      {
        title: "Tipos generados, nunca escritos a mano",
        body: "El CLI de Supabase genera TypeScript desde el esquema vivo en lib/supabase/types.ts. Cada consulta, cada mutación, cada componente importa desde ese archivo. El cambio de nombre de una columna rompe el build en cada consumidor a la vez. Sin drift, sin fixtures viejos, sin adivinanzas.",
      },
      {
        title: "shadcn + Tailwind v4 como única capa de UI",
        body: "Incluimos los componentes de shadcn en el repo y los editamos directamente. Los tokens de Tailwind v4 viven en variables CSS (OKLCH), así el sistema de diseño es tematizable sin rebuilds. Sin CSS-in-JS, sin dependencia de librería de componentes, sin resolución de estilos en runtime. Un PR cambia el color primario en toda la app.",
      },
      {
        title: "Vercel Fluid Compute en lugar de serverless",
        body: "Fluid Compute mantiene instancias calientes entre requests, así que el auth en middleware y las páginas server-rendered no pagan los costos de cold-start como serverless clásico. Clientes Supabase frescos por request (sin singletons a nivel de módulo) significa que el aislamiento entre requests concurrentes se mantiene.",
      },
    ],
    midFigure: {
      caption:
        "Pipeline de tipos: migraciones de Postgres → CLI de Supabase → TS generado → importado en todas partes.",
      initials: "TS",
    },
    stack: [
      { name: "Next.js", role: "App Router, server actions, auth en middleware" },
      { name: "React", role: "RSC-first, Suspense, streaming" },
      { name: "TypeScript", role: "Strict mode, tipos generados de Supabase" },
      { name: "Tailwind CSS", role: "Tokens OKLCH, theming dark-canonical" },
      { name: "shadcn/ui", role: "Primitivos incluidos, editados en el repo" },
      { name: "Supabase", role: "Postgres, Auth, RLS, plumbing de cookies SSR" },
      { name: "Stripe", role: "Hosted Checkout + webhooks idempotentes" },
      { name: "Cal.com", role: "Webhooks de reservas firmados con HMAC" },
      { name: "Vercel", role: "Fluid Compute, hosting en el edge, optimización de imágenes" },
    ],
    features: [
      "Middleware que refresca las sesiones de Supabase en cada request",
      "Tres clientes Supabase de un solo propósito (browser, server, admin) con guardas 'server-only'",
      "Tipos de Postgres generados, importados en cada consulta y formulario",
      "Server actions para cada mutación, revalidadas por tag o path",
      "Sistema de diseño shadcn + Tailwind compartido entre marketing y app",
      "Route groups que dividen marketing público y CRM protegido en un solo build",
      "Streaming con React 19 y boundaries de Suspense en los paths de datos lentos",
      "Tokens OKLCH dark-canonical en variables CSS, tematizables sin rebuilds",
    ],
    metrics: [
      { label: "Tablas principales", value: "10" },
      { label: "Migraciones entregadas", value: "35+" },
      { label: "Dependencias en runtime", value: "< 40" },
      { label: "Herramientas mensuales", value: "$0" },
    ],
  },
}

const byLocale: Record<Locale, Record<string, CaseStudy>> = {
  en: caseStudiesEn,
  es: caseStudiesEs,
}

export function getCaseStudies(locale: Locale): Record<string, CaseStudy> {
  return byLocale[locale] ?? caseStudiesEn
}

export function getCaseStudySlugs(): string[] {
  return Object.keys(caseStudiesEn)
}
