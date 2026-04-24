"use client"

import { useTranslations } from "next-intl"

import { Marquee } from "@/components/motion/marquee"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

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
  const t = useTranslations("tools")

  return (
    <div className="relative -mx-6 overflow-hidden sm:-mx-10 lg:-mx-20">
      <Marquee pauseOnHover className="[--duration:40s] [--gap:3rem] p-0">
        {tools.map((tool) => (
          <HoverCard key={tool.slug}>
            <HoverCardTrigger
              delay={120}
              closeDelay={80}
              className="group/logo flex h-10 w-32 shrink-0 cursor-pointer items-center justify-center sm:w-40"
            >
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
                <p className="font-heading text-base text-foreground">
                  {tool.name}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(tool.slug)}
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
