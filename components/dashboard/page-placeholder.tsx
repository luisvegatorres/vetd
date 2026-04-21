import { PageHeader } from "@/components/dashboard/page-header"

export function PagePlaceholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader eyebrow="Workspace" title={title} />
      <div className="mt-10 flex h-64 items-center justify-center border border-dashed border-border/60 text-xs uppercase text-muted-foreground">
        Coming soon
      </div>
    </>
  )
}
