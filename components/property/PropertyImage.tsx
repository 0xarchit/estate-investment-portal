"use client";
import { useState } from "react";
import { Building2 } from "lucide-react";
export function PropertyImage({
  src,
  alt,
  className = "",
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  return src && !broken ? (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  ) : (
    <div
      className={`h-full w-full min-h-36 bg-navy-50 flex flex-col items-center justify-center gap-3 text-navy-500 ${className}`}
      role="img"
      aria-label={`${alt} — image unavailable`}
    >
      <Building2 size={40} strokeWidth={1} />
      <span className="text-xs">Image unavailable</span>
    </div>
  );
}
