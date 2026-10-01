export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading content" className="page-stack">
      <div className="skeleton h-10 w-2/5" />
      <div className="grid md:grid-cols-3 gap-6">
        {[0, 1, 2].map((n) => (
          <div key={n} className="panel">
            <div className="skeleton h-44" />
            <div className="skeleton h-6 mt-5" />
            <div className="skeleton h-5 mt-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
