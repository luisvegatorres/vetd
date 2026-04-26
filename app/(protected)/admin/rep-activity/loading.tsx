import { PageSkeleton } from "@/components/dashboard/page-skeleton"

export default function RepActivityLoading() {
  return (
    <PageSkeleton>
      <PageSkeleton.Header />
      <PageSkeleton.Filters />
      <PageSkeleton.Table rows={8} />
    </PageSkeleton>
  )
}
