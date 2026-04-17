import { Marquee } from "@/components/motion/marquee"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

type Tool = {
  name: string
  slug: string
  description: string
}

const tools: Tool[] = [
  {
    name: "Next.js",
    slug: "nextdotjs",
    description:
      "Our go-to React framework for high-performance websites, web apps, and SEO-friendly builds.",
  },
  {
    name: "shadcn/ui",
    slug: "shadcnui",
    description:
      "A composable component system we use to build interfaces that stay fast, consistent, and easy to extend.",
  },
  {
    name: "Tailwind CSS",
    slug: "tailwindcss",
    description:
      "Utility-first styling that lets us design and ship polished interfaces without slowing implementation down.",
  },
  {
    name: "Vercel",
    slug: "vercel",
    description:
      "Deployment and hosting infrastructure for fast releases, previews, and reliable production delivery.",
  },
  {
    name: "Flutter",
    slug: "flutter",
    description:
      "Cross-platform app framework for building mobile products with a single codebase and native-feeling UX.",
  },
  {
    name: "Supabase",
    slug: "supabase",
    description:
      "Backend platform we use for auth, databases, storage, and real-time features without heavy overhead.",
  },
  {
    name: "PostgreSQL",
    slug: "postgresql",
    description:
      "The database layer behind structured, scalable products that need strong querying and long-term reliability.",
  },
  {
    name: "Anthropic",
    slug: "anthropic",
    description:
      "AI models we integrate when products need advanced reasoning, assistants, or workflow automation.",
  },
  {
    name: "OpenAI",
    slug: "openai",
    description:
      "A core AI platform in our stack for conversational features, automation, and intelligent product experiences.",
  },
  {
    name: "Figma",
    slug: "figma",
    description:
      "Where product structure, interface systems, and design decisions get shaped before development starts.",
  },
  {
    name: "Framer",
    slug: "framer",
    description:
      "Useful for fast-moving marketing builds, interactive prototypes, and visual storytelling on the web.",
  },
]

const LOGO_CDN = "https://cdn.jsdelivr.net/npm/simple-icons@v14/icons"

export function CraftLogoCloud() {
  return (
    <div className="relative -mx-6 overflow-hidden sm:-mx-10 lg:-mx-20">
      <Marquee pauseOnHover className="[--duration:40s] [--gap:3rem] p-0">
        {tools.map((tool) => (
          <HoverCard key={tool.slug} openDelay={120} closeDelay={80}>
            <HoverCardTrigger className="group/logo flex h-10 w-32 shrink-0 cursor-pointer items-center justify-center sm:w-40">
              <img
                src={`${LOGO_CDN}/${tool.slug}.svg`}
                alt={tool.name}
                loading="lazy"
                className="h-7 w-auto opacity-55 transition-opacity duration-300 group-hover/logo:opacity-100 dark:invert"
              />
            </HoverCardTrigger>
            <HoverCardContent
              side="top"
              className="w-72 rounded-none border border-border bg-popover/95 p-4 panel-blur-soft"
            >
              <div className="flex flex-col gap-2">
                <p className="font-heading text-base tracking-tight text-foreground">
                  {tool.name}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
      </Marquee>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent sm:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent sm:w-40" />
    </div>
  )
}
