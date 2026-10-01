'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  X,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { Withdrawal, reviewWithdrawal } from '@/lib/api/admin';
import { safeFormatINR } from '@/components/admin/PayoutTable';

interface WithdrawalReviewModalProps {
  withdrawal: Withdrawal | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function WithdrawalReviewModal({
  withdrawal,
  open,
  onClose,
  onRefresh,
}: WithdrawalReviewModalProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open || !withdrawal) return null;

  const handleApprove = async () => {
    try {
      setLoading(true);
      await reviewWithdrawal(withdrawal._id, 'APPROVE');
      toast.success(`Withdrawal of ${safeFormatINR(withdrawal.amount)} approved successfully!`);
      handleClose();
      onRefresh();
    } catch (err: any) {
      if (err?.code === 'INSUFFICIENT_BALANCE') {
        toast.error('Cannot approve withdrawal: Investor has insufficient wallet balance!');
      } else {
        toast.error(err?.message || 'Failed to approve withdrawal');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setReasonError('Please provide a reason of at least 5 characters.');
      return;
    }

    try {
      setLoading(true);
      await reviewWithdrawal(withdrawal._id, 'REJECT', reason.trim());
      toast.success(`Withdrawal request rejected.`);
      handleClose();
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setRejecting(false);
    setReason('');
    setReasonError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Review Withdrawal Request</h3>
              <p className="text-xs text-gray-500">ID: {withdrawal._id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Amount Badge */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-900">Withdrawal Amount:</span>
            <span className="text-2xl font-extrabold text-emerald-700 font-tabular-nums">
              {safeFormatINR(withdrawal.amount)}
            </span>
          </div>

          {/* User Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block">Requested By</span>
              <span className="font-semibold text-gray-900">
                {withdrawal.user?.name || 'Investor'}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block">Email Address</span>
              <span className="font-semibold text-gray-900 truncate block">
                {withdrawal.user?.email || 'N/A'}
              </span>
            </div>
          </div>

          {/* Bank Details Card */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider pb-1 border-b border-gray-200">
              <Building className="w-3.5 h-3.5" />
              <span>Target Bank Details</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500 block">Account Holder:</span>
                <span className="font-medium text-gray-900">
                  {withdrawal.bankDetails?.accountName || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">IFSC Code:</span>
                <span className="font-mono font-bold text-gray-900">
                  {withdrawal.bankDetails?.ifsc || 'N/A'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 block">Account Number:</span>
                <span className="font-mono font-medium text-gray-900">
                  {withdrawal.bankDetails?.accountNumber || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Rejection Input */}
          {rejecting && (
            <form onSubmit={handleReject} className="space-y-3 pt-3 border-t border-gray-100">
              <label htmlFor="withdrawal-reject-reason" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="withdrawal-reject-reason"
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (reasonError) setReasonError(null);
                }}
                disabled={loading}
                placeholder="Reason for rejecting withdrawal (e.g., Bank details mismatch, flagged account activity)..."
                className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              {reasonError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {reasonError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejecting(false)}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel Rejection
                </button>
                <button
                  type="submit"
                  disabled={loading || reason.trim().length < 5}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Confirm Reject Withdrawal'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        {!rejecting && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Request</span>
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Approve & Release Funds'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
