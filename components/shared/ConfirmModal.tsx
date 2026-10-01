"use client";
import { Modal } from "./Modal";
export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  tone,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  tone?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} loading={loading}>
      <div className="text-sm text-muted-foreground mb-6">{description}</div>
      <div className="flex flex-wrap justify-end gap-3">
        <button
          className="btn btn-secondary"
          disabled={loading}
          onClick={onClose}
        >
          Back
        </button>
        <button
          className={`btn ${tone === "danger" ? "btn-danger" : ""}`}
          disabled={loading}
          onClick={onConfirm}
        >
          {loading ? "Processing…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
