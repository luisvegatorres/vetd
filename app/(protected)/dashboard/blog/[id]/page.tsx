import { redirect } from "next/navigation"

type PageParams = { id: string }

export default async function LegacyEditBlogPostPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { id } = await params
  redirect(`/admin/blog/${id}`)
}
