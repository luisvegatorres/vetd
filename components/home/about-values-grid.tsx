"use client"

import {
  Compass,
  Globe,
  KeyRound,
  MessageSquare,
  Rocket,
  Wrench,
} from "lucide-react"

import { AboutValueTile } from "@/components/home/about-value-tile"
import { RevealGroup } from "@/components/motion/reveal"

const values = [
  {
    icon: Rocket,
    title: "We ship products, not hours",
    copy: "Fixed scopes, fixed prices, finished work. No open-ended retainers, no billable-hour games.",
  },
  {
    icon: Compass,
    title: "Speed is a feature",
    copy: "A marketing site in 7 days. An MVP in weeks. Momentum compounds — slow projects rarely recover.",
  },
  {
    icon: Wrench,
    title: "We pick tools that win",
    copy: "Next.js, Flutter, Supabase, shadcn, Claude. Proven stacks only. No framework-of-the-month experiments on your budget.",
  },
  {
    icon: KeyRound,
    title: "You own everything",
    copy: "Code, domain, accounts, content. No lock-in, no dependencies on us to keep the lights on.",
  },
  {
    icon: Globe,
    title: "Remote by default",
    copy: "Clients across industries, time zones, and markets — held to the same standard of craft and communication.",
  },
  {
    icon: MessageSquare,
    title: "Straight answers, always",
    copy: "If something can't be done, we tell you early. No jargon, no hedging, no vendor-speak.",
  },
] as const

export function AboutValuesGrid() {
  return (
    <RevealGroup
      className="-mx-6 grid grid-cols-1 border-t border-border/60 sm:-mx-10 md:grid-cols-2 lg:-mx-20 lg:grid-cols-3"
      delayChildren={0.12}
      stagger={0.07}
    >
      {values.map((value) => (
        <AboutValueTile
          key={value.title}
          icon={value.icon}
          title={value.title}
          copy={value.copy}
        />
      ))}
    </RevealGroup>
  )
}
