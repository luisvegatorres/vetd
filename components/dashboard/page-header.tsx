export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 font-heading text-3xl font-medium uppercase tracking-tight">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}
