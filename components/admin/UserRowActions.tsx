'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { CheckCircle2, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { User, patchUser } from '@/lib/api/admin';

interface UserRowActionsProps {
  user: User;
  isSelf?: boolean;
  onRefresh: () => void;
}

export function UserRowActions({ user, isSelf = false, onRefresh }: UserRowActionsProps) {
  const [loading, setLoading] = useState(false);
  const [confirmToggleActiveOpen, setConfirmToggleActiveOpen] = useState(false);
  const [confirmApproveBrokerOpen, setConfirmApproveBrokerOpen] = useState(false);

  const handleToggleActive = async () => {
    try {
      setLoading(true);
      const newStatus = !user.isActive;
      await patchUser(user._id, { isActive: newStatus });
      toast.success(`User "${user.name}" is now ${newStatus ? 'Active' : 'Deactivated'}.`);
      setConfirmToggleActiveOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update user active status');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBroker = async () => {
    try {
      setLoading(true);
      await patchUser(user._id, { brokerApproved: true });
      toast.success(`Broker "${user.name}" approved! They can now submit property listings.`);
      setConfirmApproveBrokerOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve broker');
    } finally {
      setLoading(false);
    }
  };

  const isBroker = user.role === 'BROKER';
  const needsBrokerApproval = isBroker && !user.brokerApproved;
  const hasKyc = user.kyc && user.kyc.status !== 'NOT_SUBMITTED';

  return (
    <div className="flex items-center justify-end gap-2 flex-wrap">
      {/* Approve Broker Button */}
      {needsBrokerApproval && (
        <button
          type="button"
          onClick={() => setConfirmApproveBrokerOpen(true)}
          disabled={loading || isSelf}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
          title="Approve Broker Account"
        >
          <UserCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Approve Broker</span>
        </button>
      )}

      {/* KYC link / review */}
      {hasKyc && (
        <Link
          href={`/admin/kyc?userId=${user._id}`}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
          title="View submitted KYC"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>KYC ({user.kyc.status})</span>
        </Link>
      )}

      {/* Active Toggle Switch */}
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={`user-active-toggle-${user._id}`}
          className="text-xs text-gray-500 font-medium cursor-pointer"
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </label>
        <button
          id={`user-active-toggle-${user._id}`}
          type="button"
          role="switch"
          aria-checked={user.isActive}
          disabled={loading || isSelf}
          onClick={() => setConfirmToggleActiveOpen(true)}
          title={isSelf ? 'Cannot toggle your own status' : user.isActive ? 'Click to Deactivate' : 'Click to Activate'}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            user.isActive ? 'bg-emerald-600' : 'bg-gray-300'
          } ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              user.isActive ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Confirm Active Toggle Modal */}
      {confirmToggleActiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-2 text-gray-900">
              <AlertTriangle className={`w-5 h-5 ${user.isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
              <h3 className="text-lg font-bold">
                {user.isActive ? 'Deactivate User Account' : 'Activate User Account'}
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {user.isActive ? (
                <>
                  Are you sure you want to deactivate <strong className="text-gray-900">{user.name}</strong> ({user.email})? 
                  They will be blocked from logging in or performing any actions on the platform.
                </>
              ) : (
                <>
                  Are you sure you want to reactivate <strong className="text-gray-900">{user.name}</strong> ({user.email})? 
                  They will regain full access to their account.
                </>
              )}
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmToggleActiveOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${
                  user.isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? 'Updating...' : user.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Approve Broker Modal */}
      {confirmApproveBrokerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Approve Broker Account
            </h3>
            <p className="text-sm text-gray-600">
              Approve broker privileges for <strong className="text-gray-900">{user.name}</strong> ({user.email})?
              Once approved, this user will be permitted to source, draft, and submit properties for fractional investment listings.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmApproveBrokerOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveBroker}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                {loading ? 'Approving...' : 'Confirm Broker Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
