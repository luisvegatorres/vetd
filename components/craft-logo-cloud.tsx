import { Marquee } from "@/components/shadcn-space/animations/marquee"

type Tool = {
  name: string
  slug: string
}

const tools: Tool[] = [
  { name: "Next.js", slug: "nextdotjs" },
  { name: "shadcn/ui", slug: "shadcnui" },
  { name: "Tailwind CSS", slug: "tailwindcss" },
  { name: "Vercel", slug: "vercel" },
  { name: "Flutter", slug: "flutter" },
  { name: "Supabase", slug: "supabase" },
  { name: "PostgreSQL", slug: "postgresql" },
  { name: "Anthropic", slug: "anthropic" },
  { name: "OpenAI", slug: "openai" },
  { name: "Figma", slug: "figma" },
  { name: "Framer", slug: "framer" },
]

const LOGO_CDN = "https://cdn.jsdelivr.net/npm/simple-icons@v14/icons"

export function CraftLogoCloud() {
  return (
    <div className="relative -mx-6 overflow-hidden sm:-mx-10 lg:-mx-20">
      <Marquee pauseOnHover className="[--duration:40s] [--gap:3rem] p-0">
        {tools.map((tool) => (
          <div
            key={tool.slug}
            className="flex h-10 w-32 shrink-0 items-center justify-center sm:w-40"
          >
            <img
              src={`${LOGO_CDN}/${tool.slug}.svg`}
              alt={tool.name}
              loading="lazy"
              className="h-7 w-auto opacity-55 transition-opacity duration-300 hover:opacity-100 dark:invert"
            />
          </div>
        ))}
      </Marquee>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent sm:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent sm:w-40" />
    </div>
  )
}
