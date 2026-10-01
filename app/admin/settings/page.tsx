'use client';

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Percent,
  PieChart,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { getSettings, patchSettings, Settings } from '@/lib/api/admin';
import { AdminPageHeader, AdminErrorState } from '@/components/admin/ui';

// Settings Zod Schema validating specified business ranges:
// platform fee % (0-20), broker commission % (0-10), max ownership % (1-100)
const settingsSchema = z.object({
  platformFeePct: z.coerce
    .number({ invalid_type_error: 'Platform fee must be a number' })
    .min(0, 'Platform fee cannot be negative')
    .max(20, 'Platform fee cannot exceed 20%'),
  brokerCommissionPct: z.coerce
    .number({ invalid_type_error: 'Broker commission must be a number' })
    .min(0, 'Broker commission cannot be negative')
    .max(10, 'Broker commission cannot exceed 10%'),
  maxOwnershipPct: z.coerce
    .number({ invalid_type_error: 'Maximum ownership must be a number' })
    .min(1, 'Max ownership must be at least 1%')
    .max(100, 'Max ownership cannot exceed 100%'),
});

type SettingsFormErrors = Partial<Record<keyof Settings, string>>;

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [formData, setFormData] = useState<Settings>({
    platformFeePct: 2,
    brokerCommissionPct: 1,
    maxOwnershipPct: 49,
  });

  const [formErrors, setFormErrors] = useState<SettingsFormErrors>({});

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSettings();
      setFormData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch platform configuration settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field: keyof Settings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? ('' as any) : Number(value),
    }));
    setSavedSuccess(false);

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    const validation = settingsSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: SettingsFormErrors = {};
      validation.error.errors.forEach((err) => {
        const path = err.path[0] as keyof Settings;
        fieldErrors[path] = err.message;
      });
      setFormErrors(fieldErrors);
      toast.error('Please resolve configuration validation errors.');
      return;
    }

    try {
      setSaving(true);
      setFormErrors({});
      const updated = await patchSettings(validation.data);
      setFormData(updated);
      setSavedSuccess(true);
      toast.success('Platform configuration saved successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-gray-500 font-medium">Loading platform settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Platform Configuration & Economics"
        subtitle="Manage global fee structures, broker commissions, and investor portfolio concentration limits"
        actions={
          <button
            type="button"
            onClick={fetchSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        }
      />

      {error && <AdminErrorState message={error} onRetry={fetchSettings} />}

      {/* Success Notification Banner */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">Settings updated and active across the platform!</span>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-medium">
            Saved
          </span>
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
          {/* Section: Platform Fee */}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                    <Percent className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Platform Fee Percentage (%)
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  Deducted from gross property sale proceeds before net payout distribution to investors.
                </p>
              </div>

              <div className="w-36">
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={formData.platformFeePct}
                    onChange={(e) => handleChange('platformFeePct', e.target.value)}
                    disabled={saving}
                    className={`w-full px-3 py-2 text-right pr-8 text-sm font-bold font-mono border rounded-lg focus:outline-none focus:ring-2 ${
                      formErrors.platformFeePct
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-gray-200 focus:ring-primary/20 focus:border-primary'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    %
                  </span>
                </div>
                {formErrors.platformFeePct && (
                  <p className="text-[11px] text-red-600 mt-1 text-right">
                    {formErrors.platformFeePct}
                  </p>
                )}
                <span className="text-[10px] text-gray-400 block text-right mt-1 font-mono">
                  Allowed: 0% – 20%
                </span>
              </div>
            </div>
          </div>

          {/* Section: Broker Commission */}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                    <Percent className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Broker Sourcing Commission (%)
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  Commission percentage automatically credited to the listing broker when a property reaches 100% FUNDED.
                </p>
              </div>

              <div className="w-36">
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.brokerCommissionPct}
                    onChange={(e) => handleChange('brokerCommissionPct', e.target.value)}
                    disabled={saving}
                    className={`w-full px-3 py-2 text-right pr-8 text-sm font-bold font-mono border rounded-lg focus:outline-none focus:ring-2 ${
                      formErrors.brokerCommissionPct
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-gray-200 focus:ring-primary/20 focus:border-primary'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    %
                  </span>
                </div>
                {formErrors.brokerCommissionPct && (
                  <p className="text-[11px] text-red-600 mt-1 text-right">
                    {formErrors.brokerCommissionPct}
                  </p>
                )}
                <span className="text-[10px] text-gray-400 block text-right mt-1 font-mono">
                  Allowed: 0% – 10%
                </span>
              </div>
            </div>
          </div>

          {/* Section: Max Ownership Per Investor */}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Maximum Ownership Cap Per Investor (%)
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  Anti-monopoly concentration rule: prevents a single investor from acquiring more than this percentage of any property.
                </p>
              </div>

              <div className="w-36">
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={formData.maxOwnershipPct}
                    onChange={(e) => handleChange('maxOwnershipPct', e.target.value)}
                    disabled={saving}
                    className={`w-full px-3 py-2 text-right pr-8 text-sm font-bold font-mono border rounded-lg focus:outline-none focus:ring-2 ${
                      formErrors.maxOwnershipPct
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-gray-200 focus:ring-primary/20 focus:border-primary'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    %
                  </span>
                </div>
                {formErrors.maxOwnershipPct && (
                  <p className="text-[11px] text-red-600 mt-1 text-right">
                    {formErrors.maxOwnershipPct}
                  </p>
                )}
                <span className="text-[10px] text-gray-400 block text-right mt-1 font-mono">
                  Allowed: 1% – 100%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 active:bg-primary rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Configuration...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
