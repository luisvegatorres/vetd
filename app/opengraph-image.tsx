import { ImageResponse } from "next/og"

import { site } from "@/lib/site"

export const runtime = "edge"
export const alt = "Vetd — digital product studio"
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
        <div style={{ display: "flex" }}>
          <svg
            viewBox="0 0 600 200"
            width="240"
            height="80"
            fill="#ffffff"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M105.12 55.6316H140.257V137.402L73.468 199.382H47.6235L0 135.84V55.6316H35.1369V129.85L63.014 167.09L105.12 127.767V55.6316Z" />
            <path d="M186.626 55.3709H272.29L298.716 90.7876L247.317 138.183H194.176V156.933L203.469 169.173H259.223L275.194 154.329L295.521 177.246L271.71 199.381H186.045L160.782 165.527V79.3292L186.626 55.3709ZM194.176 91.8293V111.881H234.54L256.029 91.5688L251.383 85.5792H200.855L194.176 91.8293Z" />
            <path d="M337.751 4.58984H372.888V55.6315H419.931V85.0586H372.888V158.757L381.019 169.954H405.411L426.029 151.465L444.614 175.684L419.931 199.382H363.886L337.751 165.007V85.0586H314.52L293.222 55.6315H337.751V4.58984Z" />
            <path d="M564.864 0H600.001V200H564.864V191.406L549.183 200H486.46L459.744 164.844V81.5104L486.46 56.25H549.183L564.864 64.8437V0ZM494.881 159.375L503.302 170.573H559.637L564.864 165.885V97.1354L556.443 85.6771H500.689L494.881 91.1458V159.375Z" />
          </svg>
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
