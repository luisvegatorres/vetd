import { PageSkeleton } from "@/components/dashboard/page-skeleton"

export default function AdminUsersLoading() {
  return (
    <PageSkeleton>
      <PageSkeleton.Header withAction />
      <PageSkeleton.Table rows={8} />
    </PageSkeleton>
  )
}
