import { PageSkeleton } from "@/components/dashboard/page-skeleton"

export default function SettingsLoading() {
  return (
    <PageSkeleton>
      <PageSkeleton.Header />
      <PageSkeleton.Section rows={3} />
      <PageSkeleton.Section rows={2} />
    </PageSkeleton>
  )
}
