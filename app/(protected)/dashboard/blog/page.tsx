import { redirect } from "next/navigation"

export default function LegacyDashboardBlogPage() {
  redirect("/admin/blog")
}
