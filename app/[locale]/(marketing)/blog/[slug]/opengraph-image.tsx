import { ImageResponse } from "next/og"

import { routing, type Locale } from "@/i18n/routing"
import { getPostBySlug } from "@/lib/blog/queries"
import { site } from "@/lib/site"

export const alt = "Vetd blog post"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Note: not using runtime='edge' here because getPostBySlug uses the SSR
// Supabase client which depends on next/headers cookies. Node runtime works
// equally well for ImageResponse and avoids edge-runtime cookie limitations.

export default async function BlogPostOg({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale = (routing.locales.includes(rawLocale as Locale)
    ? rawLocale
    : "en") as Locale

  const post = await getPostBySlug(locale, slug)
  const title = post?.title ?? site.name
  const subtitle = post?.excerpt ?? site.tagline
  const tag = post?.tags[0] ?? "Blog"

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
          <span>{tag}</span>
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
              fontSize: 76,
              lineHeight: 1.05,
              fontWeight: 500,
              letterSpacing: -2,
              display: "flex",
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontSize: 28,
                color: "#d1d5db",
                display: "flex",
                maxWidth: 1040,
                lineHeight: 1.3,
              }}
            >
              {subtitle}
            </div>
          ) : null}
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
          {site.url.replace(/^https?:\/\//, "")}/blog/{slug}
        </div>
      </div>
    ),
    size,
  )
}
