import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import type { Property } from "@/lib/types";
import { formatINR, formatPct } from "@/lib/format";
import { FundingBar } from "@/components/shared/FundingBar";
import { StatusChip } from "@/components/shared/StatusChip";
import { PropertyImage } from "./PropertyImage";
export function PropertyCard({
  property: p,
  basePath = "/properties",
}: {
  property: Property;
  basePath?: string;
}) {
  return (
    <article className="group overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
      <Link href={`${basePath}/${p._id}`} className="block">
        <div className="aspect-[16/10] relative overflow-hidden">
          <PropertyImage
            src={p.images?.[0]?.url}
            alt={p.title}
            className="group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute left-4 top-4">
            <StatusChip status={p.status} />
          </div>
          <span className="absolute bottom-4 left-4 text-xs font-medium bg-white/95 px-2.5 py-1.5 rounded">
            {p.type.toLowerCase().replaceAll("_", " ")}
          </span>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            <MapPin size={13} />
            {p.city}
            {p.state ? `, ${p.state}` : ""}
          </p>
          <h3 className="font-heading text-lg font-semibold text-navy line-clamp-2 min-h-14">
            {p.title}
          </h3>
          <div className="flex justify-between gap-2 mt-4 mb-5">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Price per unit
              </p>
              <p className="text-xl font-semibold tabular-nums text-navy">
                {formatINR(p.unitPrice)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">
                Est. annual return
              </p>
              <p className="text-xl font-semibold text-emerald-700 tabular-nums">
                {p.expectedAppreciationPct !== undefined
                  ? formatPct(p.expectedAppreciationPct)
                  : "—"}
              </p>
            </div>
          </div>
          <FundingBar pct={p.fundingPct} />
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {p.remainingUnits.toLocaleString("en-IN")} units remaining
            </p>
            <span className="text-sm font-semibold text-navy flex items-center gap-1">
              View property <ArrowUpRight size={16} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
