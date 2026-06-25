type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="flex min-h-dvh items-center justify-center p-6">
      <div className="rounded-2xl border border-border bg-background px-6 py-5 text-sm text-muted-foreground">
        {title} soon.
      </div>
    </section>
  )
}
