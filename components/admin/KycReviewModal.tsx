'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  X,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  User as UserIcon,
} from 'lucide-react';
import { AdminKycItem, reviewKyc } from '@/lib/api/admin';

interface KycReviewModalProps {
  item: AdminKycItem | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function KycReviewModal({
  item,
  open,
  onClose,
  onRefresh,
}: KycReviewModalProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePreviewDoc, setActivePreviewDoc] = useState<{ url: string; name: string } | null>(null);

  if (!open || !item) return null;

  const handleApprove = async () => {
    try {
      setLoading(true);
      await reviewKyc(item.userId, 'APPROVE');
      toast.success(`KYC for ${item.name} approved successfully!`);
      handleClose();
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve KYC');
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
      await reviewKyc(item.userId, 'REJECT', reason.trim());
      toast.success(`KYC for ${item.name} rejected.`);
      handleClose();
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setRejecting(false);
    setReason('');
    setReasonError(null);
    setActivePreviewDoc(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">KYC Verification Review</h3>
              <p className="text-xs text-gray-500">
                User: {item.name} ({item.email})
              </p>
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* User Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block">Full Name</span>
              <span className="font-semibold text-gray-900">{item.name}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block">Email Address</span>
              <span className="font-semibold text-gray-900">{item.email}</span>
            </div>
            {item.phone && (
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Phone</span>
                <span className="font-semibold text-gray-900">{item.phone}</span>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block">Current Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                {item.kyc?.status || 'PENDING'}
              </span>
            </div>
          </div>

          {/* Submitted Documents Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Submitted Documents ({item.kyc?.docs?.length || 0})
            </h4>

            {(!item.kyc?.docs || item.kyc.docs.length === 0) ? (
              <div className="p-4 border border-dashed rounded-lg text-center text-sm text-gray-400">
                No documents uploaded.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.kyc.docs.map((doc, idx) => {
                  const isImage = doc.url.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i) || doc.name?.match(/\.(jpeg|jpg|png|webp|gif)$/i);
                  return (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-xl p-3 bg-white hover:border-primary/50 transition-colors flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600 flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {doc.name || `Document #${idx + 1}`}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {isImage ? 'Image Document' : 'Document / PDF'}
                          </p>
                        </div>
                      </div>

                      {/* Thumbnail or Preview Link */}
                      <div className="mt-3 flex items-center gap-2">
                        {isImage && (
                          <button
                            type="button"
                            onClick={() => setActivePreviewDoc(doc)}
                            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                          >
                            Preview Image
                          </button>
                        )}
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-600 hover:text-gray-900 font-medium inline-flex items-center gap-1 ml-auto"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Image Preview Dialog */}
          {activePreviewDoc && (
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Preview: {activePreviewDoc.name}</span>
                <button
                  type="button"
                  onClick={() => setActivePreviewDoc(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Close Preview
                </button>
              </div>
              <div className="max-h-60 overflow-hidden rounded-lg bg-black/5 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePreviewDoc.url}
                  alt={activePreviewDoc.name || 'KYC Document'}
                  className="max-h-60 w-auto object-contain"
                />
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {rejecting && (
            <form onSubmit={handleReject} className="space-y-3 pt-3 border-t border-gray-100">
              <label htmlFor="kyc-reject-reason" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Reason for KYC Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="kyc-reject-reason"
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (reasonError) setReasonError(null);
                }}
                disabled={loading}
                placeholder="Provide a clear reason (e.g., Unclear photo ID, name mismatch with bank account, expired ID document)..."
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
                  {loading ? 'Submitting...' : 'Confirm Reject KYC'}
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
              <span>Reject KYC</span>
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Approving...' : 'Approve KYC'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
