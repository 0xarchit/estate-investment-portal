'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { AlertCircle, X } from 'lucide-react';

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, { message: 'Rejection reason must be at least 5 characters.' }),
});

interface RejectModalProps {
  open: boolean;
  propertyTitle: string;
  loading?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
  onClose: () => void;
}

export function RejectModal({
  open,
  propertyTitle,
  loading = false,
  onConfirm,
  onClose,
}: RejectModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = rejectSchema.safeParse({ reason });
    if (!result.success) {
      setError(result.error.errors[0]?.message || 'Please provide a valid reason.');
      return;
    }

    setError(null);
    await onConfirm(reason.trim());
    setReason('');
  };

  const handleClose = () => {
    if (loading) return;
    setError(null);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-dialog-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <h3 id="reject-dialog-title" className="text-lg font-semibold text-gray-900">
              Reject Property Submission
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            You are rejecting the listing for{' '}
            <strong className="text-gray-900 font-semibold">{propertyTitle}</strong>. The broker
            will see this explanation and be allowed to make corrections and resubmit.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="reject-reason" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reject-reason"
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              disabled={loading}
              placeholder="Explain what needs to be changed (e.g., Incomplete documentation, incorrect valuation documents, blurred photos)..."
              className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${
                error
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-gray-200 focus:ring-primary/20 focus:border-primary'
              }`}
            />
            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
            <p className="text-[11px] text-gray-500 text-right">Minimum 5 characters</p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 5}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Rejecting...
                </span>
              ) : (
                'Confirm Rejection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
