export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string
  title: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-overline font-medium uppercase text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-heading text-xl font-medium">
          {title}
        </h1>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
