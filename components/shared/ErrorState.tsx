import { AlertCircle } from "lucide-react";
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-6"
    >
      <div className="flex gap-3">
        <AlertCircle className="text-red-700 shrink-0" size={20} />
        <div>
          <h3 className="font-semibold text-red-900">
            Something needs another try
          </h3>
          <p className="text-sm text-red-800 mt-1">{message}</p>
          {onRetry && (
            <button className="btn btn-secondary mt-4" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
