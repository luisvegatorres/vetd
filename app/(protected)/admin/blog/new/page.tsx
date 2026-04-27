import { redirect } from "next/navigation"

import { PostEditor } from "@/app/(protected)/admin/blog/_components/post-editor"
import { createClient } from "@/lib/supabase/server"

export default async function NewBlogPostPage() {
  // Defence in depth — the protected layout already redirects unauthenticated
  // visitors, but admin role enforcement also happens in server actions.
  // Bounce non-admin users early when they hit this URL directly.
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/auth/login?next=/admin/blog/new")
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (profile?.role !== "admin") redirect("/dashboard")

  return <PostEditor mode="create" />
}
