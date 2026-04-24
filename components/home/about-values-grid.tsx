"use client"

import {
  Compass,
  Globe,
  KeyRound,
  MessageSquare,
  Rocket,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { AboutValueTile } from "@/components/home/about-value-tile"
import { RevealGroup } from "@/components/motion/reveal"

const VALUE_KEYS = [
  "ship",
  "speed",
  "tools",
  "ownership",
  "remote",
  "straight",
] as const

const VALUE_ICONS: Record<(typeof VALUE_KEYS)[number], LucideIcon> = {
  ship: Rocket,
  speed: Compass,
  tools: Wrench,
  ownership: KeyRound,
  remote: Globe,
  straight: MessageSquare,
}

export function AboutValuesGrid() {
  const t = useTranslations("home.about.values")

  return (
    <RevealGroup
      className="-mx-6 grid grid-cols-1 border-t border-border/60 sm:-mx-10 md:grid-cols-2 lg:-mx-20 lg:grid-cols-3"
      delayChildren={0.12}
      stagger={0.07}
    >
      {VALUE_KEYS.map((key) => (
        <AboutValueTile
          key={key}
          icon={VALUE_ICONS[key]}
          title={t(`${key}.title`)}
          copy={t(`${key}.copy`)}
        />
      ))}
    </RevealGroup>
  )
}
