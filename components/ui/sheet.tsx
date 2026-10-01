"use client";
import React from "react";
import { DialogContent } from "./dialog";
export {
  Dialog as Sheet,
  DialogTrigger as SheetTrigger,
  DialogClose as SheetClose,
  DialogHeader as SheetHeader,
  DialogFooter as SheetFooter,
  DialogTitle as SheetTitle,
  DialogDescription as SheetDescription,
  DialogPortal as SheetPortal,
  DialogOverlay as SheetOverlay,
} from "./dialog";

export function SheetContent({
  side = "right",
  className = "",
  ...props
}: React.ComponentProps<typeof DialogContent> & {
  side?: "left" | "right" | "top" | "bottom";
}) {
  const placement =
    side === "left"
      ? "mr-auto ml-0 h-dvh max-h-none rounded-none"
      : side === "right"
        ? "ml-auto mr-0 h-dvh max-h-none rounded-none"
        : side === "top"
          ? "mt-0 w-full max-w-none rounded-t-none"
          : "mb-0 w-full max-w-none rounded-b-none";
  return <DialogContent {...props} className={`${placement} ${className}`} />;
}
