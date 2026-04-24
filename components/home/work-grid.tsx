"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowUpRight } from "lucide-react"

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const FILTER_KEYS = ["all", "websites", "mobile", "saas"] as const
type FilterKey = (typeof FILTER_KEYS)[number]
type ProjectCategory = Exclude<FilterKey, "all">

type ProjectMetaKind = "metaWebsite" | "metaMobile" | "metaSaas"

type Project = {
  key: string
  category: ProjectCategory
  metaKind: ProjectMetaKind
  metaYear: string
  href?: string
}

const projects: Project[] = [
  {
    key: "innovate-app-studios",
    category: "saas",
    metaKind: "metaSaas",
    metaYear: "2026",
    href: "/work/innovate-app-studios",
  },
  {
    key: "alpha",
    category: "websites",
    metaKind: "metaWebsite",
    metaYear: "2026",
  },
  {
    key: "beta",
    category: "mobile",
    metaKind: "metaMobile",
    metaYear: "2026",
  },
  {
    key: "gamma",
    category: "saas",
    metaKind: "metaSaas",
    metaYear: "2025",
  },
  {
    key: "delta",
    category: "websites",
    metaKind: "metaWebsite",
    metaYear: "2025",
  },
  {
    key: "epsilon",
    category: "websites",
    metaKind: "metaWebsite",
    metaYear: "2025",
  },
  {
    key: "zeta",
    category: "saas",
    metaKind: "metaSaas",
    metaYear: "2025",
  },
]

export function WorkGrid() {
  const [active, setActive] = React.useState<FilterKey>("all")
  const t = useTranslations("home.work")
  const tFilters = useTranslations("home.work.filters")
  const tProjects = useTranslations("home.work.projects")

  const visible =
    active === "all"
      ? projects
      : projects.filter((project) => project.category === active)

  return (
    <div className="space-y-10">
      <Reveal y={16}>
        <div className="flex flex-wrap gap-3">
          {FILTER_KEYS.map((key) => {
            const isActive = active === key
            return (
              <Button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  !isActive &&
                    "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {tFilters(key)}
              </Button>
            )
          })}
        </div>
      </Reveal>

      <RevealGroup
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        delayChildren={0.08}
        stagger={0.06}
      >
        {visible.map((project) => {
          const title = tProjects(`${project.key}.title`)
          const tagline = tProjects(`${project.key}.tagline`)
          const meta = t(project.metaKind, { year: project.metaYear })
          const category = tFilters(project.category)
          const card = (
            <Card className="group/project h-full gap-0 rounded-none bg-card p-0 ring-1 ring-border transition-colors hover:ring-foreground/40">
              <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-muted">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.12]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                    backgroundSize: "2rem 2rem",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-heading text-6xl leading-none text-muted-foreground/40 uppercase sm:text-7xl">
                    {title
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </span>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground uppercase backdrop-blur-sm">
                    {category}
                  </span>
                </div>
                <ArrowUpRight className="absolute top-4 right-4 size-5 text-muted-foreground transition-colors group-hover/project:text-foreground" />
              </div>
              <CardContent className="space-y-3 px-6 py-6">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {meta}
                </p>
                <h3 className="font-heading text-2xl leading-subheading text-foreground capitalize">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {tagline}
                </p>
              </CardContent>
            </Card>
          )

          return (
            <RevealItem key={project.key} y={22}>
              {project.href ? (
                <Link href={project.href} className="block h-full">
                  {card}
                </Link>
              ) : (
                card
              )}
            </RevealItem>
          )
        })}
      </RevealGroup>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : null}
    </div>
  )
}
