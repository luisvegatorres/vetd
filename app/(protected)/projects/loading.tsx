import { PageSkeleton } from "@/components/dashboard/page-skeleton"

export default function ProjectsLoading() {
  return (
    <PageSkeleton>
      <PageSkeleton.Header withAction />
      <PageSkeleton.Filters />
      <PageSkeleton.Table rows={8} />
    </PageSkeleton>
  )
}
