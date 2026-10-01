"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { Media } from "@/lib/types";
import { PropertyImage } from "./PropertyImage";
import { Modal } from "@/components/shared/Modal";
export function PropertyGallery({
  images,
  title,
}: {
  images: Media[];
  title: string;
}) {
  const list = images.slice(0, 8);
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const change = (n: number) => setSelected((n + list.length) % list.length);
  return (
    <>
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/8] overflow-hidden rounded-2xl bg-navy-50">
        <PropertyImage
          key={list[selected]?.url}
          src={list[selected]?.url}
          alt={`${title} — ${list[selected]?.name ?? "property view"}`}
        />
        {list.length > 0 && (
          <button
            onClick={() => setOpen(true)}
            className="absolute bottom-4 right-4 btn btn-secondary btn-sm"
          >
            <Expand size={16} /> View photos
          </button>
        )}
      </div>
      {list.length > 1 && (
        <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
          {list.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              aria-label={`View photo ${i + 1}: ${img.name}`}
              aria-pressed={selected === i}
              className={`w-20 h-16 shrink-0 rounded-lg overflow-hidden border-2 ${selected === i ? "border-emerald-700" : "border-transparent"}`}
              onClick={() => setSelected(i)}
            >
              <PropertyImage src={img.url} alt={img.name} />
            </button>
          ))}
        </div>
      )}
      <Modal
        open={open}
        title={`${title} · ${selected + 1} / ${list.length}`}
        onClose={() => setOpen(false)}
      >
        <div
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") change(selected - 1);
            if (e.key === "ArrowRight") change(selected + 1);
          }}
        >
          <div className="aspect-video">
            <PropertyImage
              key={list[selected]?.url}
              src={list[selected]?.url}
              alt={list[selected]?.name ?? title}
            />
          </div>
          <div className="flex justify-between mt-4">
            <button
              className="btn btn-secondary"
              onClick={() => change(selected - 1)}
              aria-label="Previous photo"
            >
              <ChevronLeft />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => change(selected + 1)}
              aria-label="Next photo"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
