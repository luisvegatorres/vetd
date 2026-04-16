"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { HeroShader } from "@/components/hero-shader"
import { Section } from "@/components/section"
import { Badge } from "@/components/ui/badge"

export function HomeHero() {
  const [pointer, setPointer] = React.useState({ x: 0, y: 0 })
  const [isActive, setIsActive] = React.useState(false)

  const updatePointer = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      setPointer({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    },
    []
  )

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      updatePointer(event)
      setIsActive(true)
    },
    [updatePointer]
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      updatePointer(event)
    },
    [updatePointer]
  )

  const handlePointerLeave = React.useCallback(() => {
    setIsActive(false)
  }, [])

  return (
    <div
      className="relative border-b border-border/60"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <HeroShader
        active={isActive}
        className="absolute inset-0"
        pointerX={pointer.x}
        pointerY={pointer.y}
      />
      <Section
        size="sm"
        className="relative z-10 flex min-h-[calc(100svh-4rem)] items-center border-b-0 py-12 sm:py-16"
      >
        <div className="grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-8">
            <Badge
              variant="outline"
              className="rounded-none border-primary/50 bg-transparent px-3 py-1 text-[10px] tracking-[0.22em] text-primary uppercase"
            >
              Home
            </Badge>

            <div className="space-y-4">
              <h1 className="font-heading text-5xl leading-[0.95] font-normal tracking-tight text-foreground uppercase sm:text-6xl md:text-7xl lg:text-[5.5rem]">
                We build digital
                <br />
                <span className="text-primary">products that grow</span>
                <br />
                businesses.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Websites. Mobile apps. Web apps. AI integrations. Growth
                systems. Built to perform, designed to convert.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/contact"
                className="inline-flex h-14 items-center justify-center gap-2 bg-primary px-8 text-base font-medium tracking-[0.14em] text-primary-foreground uppercase transition-colors hover:bg-primary/85"
              >
                Start a project
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/work"
                className="inline-flex h-14 items-center justify-center gap-2 border border-foreground/30 px-6 text-sm font-medium tracking-[0.18em] text-foreground uppercase transition-colors hover:bg-foreground/5"
              >
                See our work
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="bg-card/80 ring-1 ring-border backdrop-blur-[2px]">
            <div className="flex h-full flex-col justify-between gap-8 p-8">
              <p className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
                / 001 - Digital product studio
              </p>
              <div className="space-y-6">
                <div className="border-t border-border pt-4">
                  <p className="font-heading text-4xl text-primary">5</p>
                  <p className="mt-1 text-xs tracking-[0.18em] text-muted-foreground uppercase">
                    Core product lines
                  </p>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="font-heading text-4xl text-primary">Global</p>
                  <p className="mt-1 text-xs tracking-[0.18em] text-muted-foreground uppercase">
                    Remote delivery from day one
                  </p>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="font-heading text-4xl text-primary">Fixed</p>
                  <p className="mt-1 text-xs tracking-[0.18em] text-muted-foreground uppercase">
                    Scope, timeline, and pricing before build starts
                  </p>
                </div>
              </div>
              <p className="text-[10px] tracking-[0.3em] text-muted-foreground/70 uppercase">
                Websites · Apps · Growth · AI
              </p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
