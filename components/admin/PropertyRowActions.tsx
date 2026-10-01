'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  AlertOctagon,
  Building,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import { Property, approveProperty, rejectProperty, setPropertyStatus } from '@/lib/api/admin';
import { RejectModal } from '@/components/admin/RejectModal';

interface PropertyRowActionsProps {
  property: Property;
  onRefresh: () => void;
}

export function PropertyRowActions({ property, onRefresh }: PropertyRowActionsProps) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmHoldingOpen, setConfirmHoldingOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    try {
      setLoading(true);
      await approveProperty(property._id);
      toast.success(`Property "${property.title}" approved and moved to LIVE!`);
      setConfirmApproveOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve property');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      setLoading(true);
      await rejectProperty(property._id, reason);
      toast.success(`Property "${property.title}" has been rejected.`);
      setRejectModalOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject property');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToHolding = async () => {
    try {
      setLoading(true);
      await setPropertyStatus(property._id, 'HOLDING');
      toast.success(`Property "${property.title}" moved to HOLDING status!`);
      setConfirmHoldingOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update property status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAndRefund = async () => {
    try {
      setLoading(true);
      await setPropertyStatus(property._id, 'CANCELLED');
      toast.success(`Property cancelled. All investors have been refunded to their wallet.`);
      setConfirmCancelOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel property');
    } finally {
      setLoading(false);
    }
  };

  const status = property.status;

  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      {/* PENDING_APPROVAL -> Approve & Reject */}
      {status === 'PENDING_APPROVAL' && (
        <>
          <button
            type="button"
            onClick={() => setConfirmApproveOpen(true)}
            disabled={loading}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
            title="Approve Listing"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approve</span>
          </button>

          <button
            type="button"
            onClick={() => setRejectModalOpen(true)}
            disabled={loading}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
            title="Reject Listing"
          >
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Reject</span>
          </button>
        </>
      )}

      {/* LIVE -> Cancel & refund */}
      {status === 'LIVE' && (
        <button
          type="button"
          onClick={() => setConfirmCancelOpen(true)}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
          title="Cancel Listing & Refund All Investors"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
          <span>Cancel & Refund</span>
        </button>
      )}

      {/* FUNDED -> Move to HOLDING */}
      {status === 'FUNDED' && (
        <button
          type="button"
          onClick={() => setConfirmHoldingOpen(true)}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors disabled:opacity-50"
          title="Acquisition Confirmed -> Move to HOLDING"
        >
          <Building className="w-3.5 h-3.5 text-purple-600" />
          <span>Move to HOLDING</span>
        </button>
      )}

      {/* HOLDING -> Record sale */}
      {status === 'HOLDING' && (
        <Link
          href={`/admin/properties/${property._id}/sell`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-primary text-white hover:bg-primary/90 shadow-sm transition-colors"
          title="Record Sale & Distribute Payouts"
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Record Sale</span>
        </Link>
      )}

      {/* View Public Listing */}
      <Link
        href={`/properties/${property._id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        title="View Public Details"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>View</span>
      </Link>

      {/* Reject Modal */}
      <RejectModal
        open={rejectModalOpen}
        propertyTitle={property.title}
        loading={loading}
        onConfirm={handleReject}
        onClose={() => setRejectModalOpen(false)}
      />

      {/* Confirm Approve Modal */}
      {confirmApproveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Approve Property Listing
            </h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to approve{' '}
              <strong className="text-gray-900 font-semibold">{property.title}</strong>? Once
              approved, status will become <span className="font-semibold text-blue-600">LIVE</span> and
              it will immediately appear in the marketplace for investors to buy units.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmApproveOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                {loading ? 'Approving...' : 'Confirm & Go LIVE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Move to HOLDING Modal */}
      {confirmHoldingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              Move to HOLDING
            </h3>
            <p className="text-sm text-gray-600">
              Confirm property acquisition for{' '}
              <strong className="text-gray-900 font-semibold">{property.title}</strong>. This moves
              the property from <span className="font-semibold text-emerald-600">FUNDED</span> to{' '}
              <span className="font-semibold text-purple-600">HOLDING</span>. Investors will see it
              as an active holding generating rental yield and appreciation.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmHoldingOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMoveToHolding}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors"
              >
                {loading ? 'Updating...' : 'Confirm HOLDING'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel & Refund Modal */}
      {confirmCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-red-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertOctagon className="w-6 h-6" />
              <h3 className="text-lg font-bold text-red-950">
                Cancel & Refund Property
              </h3>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium">
              Refund every investor in full to wallet. This cannot be undone.
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel{' '}
              <strong className="text-gray-900 font-semibold">{property.title}</strong>? All units
              will be cancelled, and 100% of invested funds will be immediately credited back to
              each investor's wallet with ledger audit entries.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmCancelOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCancelAndRefund}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
              >
                {loading ? 'Refunding...' : 'Yes, Cancel & Refund All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
