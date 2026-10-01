export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5 mb-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-navy">
          {title}
        </h1>
        {subtitle && (
          <div className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {subtitle}
          </div>
        )}
      </div>
      {actions}
    </header>
  );
}
