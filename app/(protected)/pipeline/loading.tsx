import { PageSkeleton } from "@/components/dashboard/page-skeleton"

export default function PipelineLoading() {
  return (
    <PageSkeleton>
      <PageSkeleton.Header />
      <PageSkeleton.Kanban columns={4} />
    </PageSkeleton>
  )
}
