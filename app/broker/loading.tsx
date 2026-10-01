export default function BrokerLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-200" />
        ))}
      </div>
      {/* Chart */}
      <div className="h-64 rounded-2xl bg-gray-200" />
      {/* Attention panel */}
      <div className="h-40 rounded-2xl bg-gray-200" />
    </div>
  );
}
