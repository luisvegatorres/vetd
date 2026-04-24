import { ImageResponse } from "next/og"

import { site } from "@/lib/site"

export const runtime = "edge"
export const alt = "Innovate App Studios — digital product studio"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage() {
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
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#9ca3af",
          }}
        >
          {site.name}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 88,
              lineHeight: 1.05,
              fontWeight: 500,
              letterSpacing: -2,
              display: "flex",
            }}
          >
            {site.tagline}
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#9ca3af",
              display: "flex",
              maxWidth: 960,
            }}
          >
            {site.description}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          <span>Websites ▪ Apps ▪ SaaS ▪ AI</span>
          <span>{site.url.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>
    ),
    size,
  )
}
