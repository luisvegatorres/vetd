import { PageSkeleton } from "@/components/dashboard/page-skeleton"

export default function DocumentsLoading() {
  return (
    <PageSkeleton>
      <PageSkeleton.Header withAction />
      <PageSkeleton.Grid count={6} />
    </PageSkeleton>
  )
}
