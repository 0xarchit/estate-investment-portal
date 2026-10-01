"use client";
import { useEffect, useRef, useId } from "react";
import { X } from "lucide-react";
export function Modal({
  open,
  title,
  onClose,
  children,
  loading = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  loading?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const el = ref.current;
    if (open && !el?.open) el?.showModal();
    else if (!open && el?.open) el?.close();
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        if (!loading) onClose();
      }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (
          e.target === e.currentTarget &&
          !loading &&
          (e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom)
        )
          onClose();
      }}
      className="modal"
    >
      <div className="flex justify-between gap-4 mb-6">
        <h2 id={id} className="text-xl font-semibold">
          {title}
        </h2>
        <button
          aria-label="Close dialog"
          disabled={loading}
          onClick={onClose}
          className="icon-button"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
