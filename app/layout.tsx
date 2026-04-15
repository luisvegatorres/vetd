import type { Metadata } from "next"
import { Geist_Mono, Noto_Sans } from "next/font/google"

import "./globals.css"
import { PageTransition } from "@/components/page-transition"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { site } from "@/lib/site"

const geistMonoHeading = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-heading",
})

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://innovateappstudios.com"),
  title: {
    default: `${site.name} — Sitios web para negocios en Puerto Rico`,
    template: `%s · ${site.name}`,
  },
  description:
    "Sitios web, Google Business Profile y SEO bilingüe para restaurantes, turismo y Airbnb en Puerto Rico. Sin contrato, mes a mes.",
  openGraph: {
    title: `${site.name} — Sitios web para negocios en Puerto Rico`,
    description:
      "Todo lo que necesitas para crecer en línea. Sin contrato, mes a mes.",
    locale: "es_PR",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        notoSans.variable,
        geistMonoHeading.variable
      )}
    >
      <body className="min-h-svh bg-background text-foreground">
        <ThemeProvider defaultTheme="dark">
          <div className="flex min-h-svh flex-col">
            <SiteHeader />
            <main className="flex-1">
              <PageTransition>{children}</PageTransition>
            </main>
            <SiteFooter />
          </div>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
