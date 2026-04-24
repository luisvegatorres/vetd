import { ImageResponse } from "next/og"
import { getTranslations } from "next-intl/server"

import { routing, type Locale } from "@/i18n/routing"
import { financing, site } from "@/lib/site"

export const runtime = "edge"
export const alt = "Financing — 0% for 12 months"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function FinancingOg({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = (routing.locales.includes(rawLocale as Locale)
    ? rawLocale
    : "en") as Locale
  const t = await getTranslations({ locale, namespace: "financing" })

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
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#9ca3af",
            display: "flex",
          }}
        >
          {site.name} ▪ {t("badge")}
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
              fontSize: 120,
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: -4,
              display: "flex",
            }}
          >
            0% ▪ 12 mo
          </div>
          <div
            style={{
              fontSize: 36,
              color: "#d1d5db",
              display: "flex",
              maxWidth: 1000,
              lineHeight: 1.3,
            }}
          >
            {financing.depositRate}% deposit today. Spread the rest over{" "}
            {financing.months} months at 0%. No credit check.
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
          Projects ${financing.minAmount.toLocaleString()}+ ▪{" "}
          {site.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    size,
  )
}
