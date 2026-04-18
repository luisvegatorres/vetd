export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: React.ReactNode
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-heading text-xl font-medium tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
