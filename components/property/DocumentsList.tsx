import { FileText, ArrowUpRight } from "lucide-react";
import type { Media } from "@/lib/types";
export function DocumentsList({ documents }: { documents: Media[] }) {
  return (
    <div className="panel">
      {documents.length ? (
        documents.map((doc, i) => (
          <a
            href={
              /^https?:\/\//i.test(doc.url) ||
              (doc.url.startsWith("/") && !doc.url.startsWith("//"))
                ? doc.url
                : undefined
            }
            key={i}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 py-4 border-b last:border-b-0 text-sm"
          >
            <span className="flex items-center gap-3">
              <FileText className="text-navy-500" size={20} />
              {doc.name}
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              View <ArrowUpRight size={16} />
              <span className="sr-only">opens in a new tab</span>
            </span>
          </a>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No documents have been published for this property.
        </p>
      )}
    </div>
  );
}
