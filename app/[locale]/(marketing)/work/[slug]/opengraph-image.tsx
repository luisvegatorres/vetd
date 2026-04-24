import { ImageResponse } from "next/og"

import { routing, type Locale } from "@/i18n/routing"
import { getCaseStudies } from "@/lib/case-studies"
import { site } from "@/lib/site"

export const runtime = "edge"
export const alt = "Case study — Innovate App Studios"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function CaseStudyOg({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale = (routing.locales.includes(rawLocale as Locale)
    ? rawLocale
    : "en") as Locale
  const study = getCaseStudies(locale)[slug]
  const title = study?.title ?? site.name
  const tagline = study?.tagline ?? site.tagline
  const category = study?.category ?? "Case study"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000000",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#9ca3af",
          }}
        >
          <span>{site.name}</span>
          <span>{category}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.05,
              fontWeight: 500,
              letterSpacing: -2,
              display: "flex",
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#d1d5db",
              display: "flex",
              maxWidth: 1040,
              lineHeight: 1.3,
            }}
          >
            {tagline}
          </div>
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: 3,
            display: "flex",
          }}
        >
          {site.url.replace(/^https?:\/\//, "")}/work/{slug}
        </div>
      </div>
    ),
    size,
  )
}
