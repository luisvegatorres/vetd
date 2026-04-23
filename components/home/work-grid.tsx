"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const filters = [
  "All",
  "Websites",
  "Mobile Apps",
  "SaaS Products",
] as const

type Filter = (typeof filters)[number]
type ProjectCategory = Exclude<Filter, "All">

type Project = {
  title: string
  category: ProjectCategory
  tagline: string
  meta: string
  href?: string
}

const projects: Project[] = [
  {
    title: "Innovate App Studios CRM",
    category: "SaaS Products",
    tagline: "Agency operating system: leads, projects, billing, commissions.",
    meta: "SaaS product ▪ 2026",
    href: "/work/innovate-app-studios",
  },
  {
    title: "Project Alpha",
    category: "Websites",
    tagline: "Restaurant site with online reservations.",
    meta: "Website ▪ 2026",
  },
  {
    title: "Project Beta",
    category: "Mobile Apps",
    tagline: "iOS and Android companion app for a fitness brand.",
    meta: "Mobile app ▪ 2026",
  },
  {
    title: "Project Gamma",
    category: "SaaS Products",
    tagline: "Internal booking portal replacing manual spreadsheets.",
    meta: "SaaS product ▪ 2025",
  },
  {
    title: "Project Delta",
    category: "Websites",
    tagline: "Local SEO and content engine for a service business.",
    meta: "Website ▪ 2025",
  },
  {
    title: "Project Epsilon",
    category: "Websites",
    tagline: "Product landing page driving pre-orders at launch.",
    meta: "Website ▪ 2025",
  },
  {
    title: "Project Zeta",
    category: "SaaS Products",
    tagline: "Admin dashboard with custom analytics and reporting.",
    meta: "SaaS product ▪ 2025",
  },
]

export function WorkGrid() {
  const [active, setActive] = React.useState<Filter>("All")

  const visible =
    active === "All"
      ? projects
      : projects.filter((project) => project.category === active)

  return (
    <div className="space-y-10">
      <Reveal y={16}>
        <div className="flex flex-wrap gap-3">
          {filters.map((filter) => {
            const isActive = active === filter
            return (
              <Button
                key={filter}
                type="button"
                onClick={() => setActive(filter)}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "",
                  !isActive &&
                    "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {filter}
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
                    {project.title
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </span>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground uppercase backdrop-blur-sm">
                    {project.category}
                  </span>
                </div>
                <ArrowUpRight className="absolute top-4 right-4 size-5 text-muted-foreground transition-colors group-hover/project:text-foreground" />
              </div>
              <CardContent className="space-y-3 px-6 py-6">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {project.meta}
                </p>
                <h3 className="font-heading text-2xl leading-subheading text-foreground capitalize">
                  {project.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {project.tagline}
                </p>
              </CardContent>
            </Card>
          )

          return (
            <RevealItem key={project.title} y={22}>
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
        <p className="text-sm text-muted-foreground">
          No projects in this category yet.
        </p>
      ) : null}
    </div>
  )
}
