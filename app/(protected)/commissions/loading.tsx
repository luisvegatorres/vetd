import { PageSkeleton } from "@/components/dashboard/page-skeleton"

export default function CommissionsLoading() {
  return (
    <PageSkeleton>
      <PageSkeleton.Header />
      <PageSkeleton.Cards count={3} />
      <PageSkeleton.Table rows={8} />
    </PageSkeleton>
  )
}
