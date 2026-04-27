import { redirect } from "next/navigation"

import { PostEditor } from "@/app/(protected)/dashboard/blog/_components/post-editor"
import { createClient } from "@/lib/supabase/server"

export default async function NewBlogPostPage() {
  // Defence in depth — the protected layout already redirects unauthenticated
  // visitors, but staff role enforcement only happens in the server action
  // when a sales_rep / viewer hits this URL directly. Bounce them early.
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/auth/login?next=/dashboard/blog/new")
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    redirect("/dashboard")
  }

  return <PostEditor mode="create" />
}
