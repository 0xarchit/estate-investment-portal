import { Building2 } from "lucide-react";
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel text-center py-14">
      <Building2 className="mx-auto mb-5 text-navy-400" size={34} />
      <h3 className="text-lg font-semibold text-navy">{title}</h3>
      {description && (
        <div className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
          {description}
        </div>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
