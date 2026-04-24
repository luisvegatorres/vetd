import type { MetadataRoute } from "next"

import { site } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/admin/",
          "/dashboard/",
          "/clients/",
          "/leads/",
          "/projects/",
          "/pipeline/",
          "/commissions/",
          "/payments/",
          "/documents/",
          "/settings/",
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  }
}
