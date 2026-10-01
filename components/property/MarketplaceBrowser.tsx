"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X, ArrowUpRight } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  Pagination,
} from "@/components/shared";
import { Modal } from "@/components/shared/Modal";
import { getProperties } from "@/lib/api/properties";
const filterKeys = [
  "city",
  "type",
  "status",
  "minPrice",
  "maxPrice",
  "minFunding",
  "maxFunding",
];
export function MarketplaceBrowser({ basePath }: { basePath: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [mobile, setMobile] = useState(false);
  const serialized = params.toString();
  function update(key: string, value: string) {
    const next = new URLSearchParams(serialized);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`${basePath}${next.size ? "?" + next.toString() : ""}`, {
      scroll: false,
    });
  }
  useEffect(() => {
    setSearch(params.get("search") ?? "");
  }, [params]);
  useEffect(() => {
    if (search === (params.get("search") ?? "")) return;
    const timer = setTimeout(() => update("search", search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search, serialized]);
  const rawPage = Number(params.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const filters: Record<string, string | number> = { limit: 9, page };
  for (const key of [...filterKeys, "search", "sort"]) {
    const value = params.get(key);
    if (value) filters[key] = value;
  }
  const query = useQuery({
    queryKey: ["properties", filters],
    queryFn: () => getProperties(filters),
  });
  const active = filterKeys.filter((k) => params.has(k));
  const clear = () => {
    setSearch("");
    router.replace(basePath, { scroll: false });
  };
  const field = (label: string, key: string, choices: string[][]) => (
    <label className="block text-xs font-semibold text-navy">
      {label}
      <select
        className="field mt-2"
        value={params.get(key) ?? ""}
        onChange={(e) => update(key, e.target.value)}
      >
        <option value="">All {label.toLowerCase()}</option>
        {choices.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  const filterPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-navy flex items-center gap-2">
          <SlidersHorizontal size={17} /> Refine your search
        </h2>
        <button
          className="text-xs text-emerald-700 font-semibold"
          onClick={clear}
        >
          Reset
        </button>
      </div>
      <label className="block text-xs font-semibold text-navy">
        City
        <input
          className="field mt-2"
          placeholder="e.g. Noida"
          value={params.get("city") ?? ""}
          onChange={(e) => update("city", e.target.value)}
        />
      </label>
      {field("Property types", "type", [
        ["APARTMENT", "Apartment"],
        ["VILLA", "Villa"],
        ["COMMERCIAL", "Commercial"],
        ["PLOT", "Plot"],
        ["WAREHOUSE", "Warehouse"],
      ])}
      {field("Funding statuses", "status", [
        ["LIVE", "Open for investment"],
        ["FUNDED", "Fully funded"],
      ])}
      <fieldset>
        <legend className="text-xs font-semibold text-navy mb-2">
          Price per unit (₹)
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["minPrice", "Minimum"],
            ["maxPrice", "Maximum"],
          ].map(([key, label]) => (
            <input
              key={key}
              className="field"
              aria-label={`${label} price per unit in rupees`}
              placeholder={label}
              type="number"
              min="0"
              step="1"
              value={params.has(key) ? Number(params.get(key)) / 100 : ""}
              onChange={(e) =>
                update(
                  key,
                  e.target.value
                    ? String(Math.round(Number(e.target.value) * 100))
                    : "",
                )
              }
            />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-xs font-semibold text-navy mb-2">
          Funding progress (%)
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["minFunding", "From"],
            ["maxFunding", "To"],
          ].map(([key, label]) => (
            <input
              key={key}
              className="field"
              aria-label={`${label} funding percentage`}
              placeholder={label}
              type="number"
              min="0"
              max="100"
              value={params.get(key) ?? ""}
              onChange={(e) =>
                update(
                  key,
                  e.target.value
                    ? String(Math.min(100, Math.max(0, Number(e.target.value))))
                    : "",
                )
              }
            />
          ))}
        </div>
      </fieldset>
      <div className="border-t pt-5">
        <p className="text-xs leading-6 text-muted-foreground">
          Start with the numbers. Each listing shows its unit price, funding
          progress, and expected holding period.
        </p>
      </div>
    </div>
  );
  return (
    <>
      <div className="py-9">
        <div className="flex flex-wrap gap-4 mb-8 items-center">
          <div className="relative flex-1 min-w-48">
            <Search
              size={19}
              className="absolute left-4 top-3.5 text-slate-500"
            />
            <input
              className="field pl-12 bg-white"
              aria-label="Search properties"
              placeholder="Search properties or cities"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-secondary lg:hidden"
            onClick={() => setMobile(true)}
          >
            <SlidersHorizontal size={17} />
            Filters{active.length ? ` (${active.length})` : ""}
          </button>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Sort by
            <select
              className="field w-auto"
              value={params.get("sort") ?? "-createdAt"}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="-createdAt">Newest first</option>
              <option value="unitPrice">Price: low to high</option>
              <option value="-unitPrice">Price: high to low</option>
              <option value="-fundingPct">Most funded</option>
              <option value="fundingPct">Least funded</option>
            </select>
          </label>
        </div>
        <div className="grid lg:grid-cols-[248px_1fr] gap-8">
          <aside className="hidden lg:block">
            <div className="panel sticky top-24 p-5">{filterPanel}</div>
          </aside>
          <section className="min-w-0" aria-label="Property results">
            <div className="flex flex-wrap gap-3 justify-between mb-5 items-center">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {query.isLoading
                  ? "Finding your next opportunity…"
                  : query.data
                    ? `${query.data.total} ${query.data.total === 1 ? "property" : "properties"} to explore`
                    : ""}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight size={14} /> Your share starts here
              </p>
            </div>
            {active.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {active.map((key) => (
                  <button
                    key={key}
                    className="inline-flex gap-2 items-center rounded-md border px-2 py-1.5 text-xs bg-white"
                    onClick={() => update(key, "")}
                  >
                    {key.replace(/([A-Z])/g, " $1")}:{" "}
                    {key.includes("Price")
                      ? `₹${Number(params.get(key)) / 100}`
                      : params.get(key)}
                    <X size={13} />
                    <span className="sr-only">Remove filter</span>
                  </button>
                ))}
              </div>
            )}
            {query.isLoading ? (
              <PageSkeleton />
            ) : query.isError ? (
              <ErrorState
                message="We couldn’t load properties. Check your connection and try again."
                onRetry={() => query.refetch()}
              />
            ) : !query.data?.items.length ? (
              <EmptyState
                title="No properties match"
                description="Try another city, widen your price range, or clear your filters to see all opportunities."
                action={
                  <button className="btn" onClick={clear}>
                    Clear filters
                  </button>
                }
              />
            ) : (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {query.data.items.map((p) => (
                    <PropertyCard key={p._id} property={p} basePath={basePath} />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={query.data.totalPages}
                  onChange={(n) => update("page", String(n))}
                />
              </>
            )}
          </section>
        </div>
      </div>
      <Modal
        title="Filter properties"
        open={mobile}
        onClose={() => setMobile(false)}
      >
        {filterPanel}
        <button className="btn w-full mt-6" onClick={() => setMobile(false)}>
          Show properties
        </button>
      </Modal>
    </>
  );
}
