"use client";
import { Pagination } from "./Pagination";
import { EmptyState } from "./EmptyState";
export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
}
export function DataTable<T extends object>({
  columns,
  rows,
  loading,
  emptyTitle = "No records yet",
  page = 1,
  totalPages = 1,
  onPageChange = () => {},
  sort,
  onSortChange,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  sort?: { key: string; direction: "asc" | "desc" };
  onSortChange?: (sort: { key: string; direction: "asc" | "desc" }) => void;
  onRowClick?: (row: T) => void;
}) {
  if (loading)
    return (
      <div className="panel" aria-busy="true">
        {[0, 1, 2, 3].map((n) => (
          <div className="skeleton h-12 mb-3" key={n} />
        ))}
      </div>
    );
  if (!rows.length) return <EmptyState title={emptyTitle} />;
  return (
    <>
      {onSortChange && columns.some((c) => c.sortable) && (
        <label className="sm:hidden block text-sm mb-4">
          Sort records
          <select
            className="field mt-2"
            value={sort ? `${sort.key}:${sort.direction}` : ""}
            onChange={(e) => {
              const [key, direction] = e.target.value.split(":");
              onSortChange({ key, direction: direction as "asc" | "desc" });
            }}
          >
            <option value="" disabled>
              Choose order
            </option>
            {columns
              .filter((c) => c.sortable)
              .flatMap((c) =>
                (["asc", "desc"] as const).map((direction) => (
                  <option
                    key={`${c.key}:${direction}`}
                    value={`${c.key}:${direction}`}
                  >
                    {c.header} —{" "}
                    {direction === "asc" ? "ascending" : "descending"}
                  </option>
                )),
              )}
          </select>
        </label>
      )}
      <div
        className="table-wrap"
        role="region"
        aria-label="Data table; scroll horizontally to view all columns"
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ textAlign: c.align }}
                  aria-sort={
                    sort?.key === c.key
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {c.sortable ? (
                    <button
                      onClick={() =>
                        onSortChange?.({
                          key: c.key,
                          direction:
                            sort?.key === c.key && sort.direction === "asc"
                              ? "desc"
                              : "asc",
                        })
                      }
                    >
                      {c.header} ↕
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={String((row as Record<string, unknown>)._id ?? i)}
                className={onRowClick ? "cursor-pointer" : ""}
                onClick={() => onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    data-label={c.header}
                    style={{ textAlign: c.align }}
                  >
                    {c.render
                      ? c.render(row)
                      : String((row as Record<string, unknown>)[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </>
  );
}
