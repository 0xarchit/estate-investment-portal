'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  getProperty,
  previewPayout,
  sellProperty,
  Property,
  PayoutPreview,
  Payout,
} from '@/lib/api/admin';
import { formatINR, formatCompactINR } from '@/components/admin/format';
import { AdminStatusChip, AdminPageHeader, AdminErrorState } from '@/components/admin/ui';
import { PayoutTable, safeFormatINR } from '@/components/admin/PayoutTable';

// Helper to format rupees with Indian numbering system commas
function formatRupeeInputString(val: string): string {
  const clean = val.replace(/\D/g, '');
  if (!clean) return '';
  const num = parseInt(clean, 10);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-IN').format(num);
}

export default function RecordSalePage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [propertyError, setPropertyError] = useState<string | null>(null);

  // Sale Price State in Rupees string
  const [rawRupees, setRawRupees] = useState<string>('14000000'); // default ₹1.4 Cr for demo ease
  const [formattedDisplayPrice, setFormattedDisplayPrice] = useState<string>('1,40,00,000');

  // Preview State
  const [preview, setPreview] = useState<PayoutPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Sale Execution State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executedPayout, setExecutedPayout] = useState<Payout | null>(null);

  // Load Property Details
  const fetchProperty = useCallback(async () => {
    if (!propertyId) return;
    try {
      setLoadingProperty(true);
      setPropertyError(null);
      const data = await getProperty(propertyId);
      setProperty(data);
    } catch (err: any) {
      setPropertyError(err?.message || 'Failed to load property details');
    } finally {
      setLoadingProperty(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  // Convert current rupees to paise
  const salePricePaise = useMemo(() => {
    const rupees = parseInt(rawRupees, 10);
    if (isNaN(rupees) || rupees <= 0) return 0;
    return Math.round(rupees * 100);
  }, [rawRupees]);

  // Debounced Payout Preview (400 ms)
  useEffect(() => {
    if (!property || property.status !== 'HOLDING' || salePricePaise <= 0) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingPreview(true);
        setPreviewError(null);
        const data = await previewPayout(property._id, salePricePaise);
        setPreview(data);
      } catch (err: any) {
        setPreviewError(err?.message || 'Failed to calculate payout preview');
      } finally {
        setLoadingPreview(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [property, salePricePaise]);

  // Handle Input Changes
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanNumbers = e.target.value.replace(/\D/g, '');
    setRawRupees(cleanNumbers);
    setFormattedDisplayPrice(formatRupeeInputString(cleanNumbers));
  };

  // Execute Sale Submission
  const handleExecuteSale = async () => {
    if (!property || salePricePaise <= 0 || isExecuting) return;

    try {
      setIsExecuting(true);
      const res = await sellProperty(property._id, salePricePaise);
      setExecutedPayout(res.payout);
      toast.success('Property sale recorded and payouts distributed successfully!');
      setConfirmModalOpen(false);
    } catch (err: any) {
      if (err?.code === 'ALREADY_SOLD') {
        toast.error('This property was already sold — no payout was repeated');
        fetchProperty();
        setConfirmModalOpen(false);
      } else {
        toast.error(err?.message || 'Failed to execute property sale');
      }
    } finally {
      setIsExecuting(false);
    }
  };

  // Loading Property
  if (loadingProperty) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-gray-500 font-medium">Loading property details...</p>
      </div>
    );
  }

  // Error Loading Property
  if (propertyError || !property) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/properties"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Properties</span>
        </Link>
        <AdminErrorState message={propertyError || 'Property not found'} onRetry={fetchProperty} />
      </div>
    );
  }

  // Guard: Property is already SOLD
  if (property.status === 'SOLD') {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6 text-center">
        <div className="w-16 h-16 bg-[#0F2A4A]/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Building className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 bg-[#0F2A4A] text-white rounded-full text-xs font-bold font-mono">
            STATUS: SOLD
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Property Already Sold
          </h2>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            The exit sale for <strong className="text-gray-900">{property.title}</strong> has already
            been executed and recorded. Payouts have been distributed to all investors in full.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-left max-w-md mx-auto space-y-3 text-sm">
          <div className="flex justify-between pb-2 border-b border-gray-100">
            <span className="text-gray-500">Property Valuation:</span>
            <span className="font-semibold text-gray-900">{formatINR(property.valuation)}</span>
          </div>
          {property.salePrice && (
            <div className="flex justify-between pb-2 border-b border-gray-100">
              <span className="text-gray-500">Recorded Sale Price:</span>
              <span className="font-bold text-emerald-700 font-mono">{formatINR(property.salePrice)}</span>
            </div>
          )}
          {property.soldAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">Exit Executed At:</span>
              <span className="text-gray-700">{new Date(property.soldAt).toLocaleDateString('en-IN')}</span>
            </div>
          )}
        </div>

        <div className="pt-4">
          <Link
            href="/admin/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Properties</span>
          </Link>
        </div>
      </div>
    );
  }

  // Guard: Property is NOT in HOLDING
  if (property.status !== 'HOLDING') {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-medium text-gray-500">Current Status:</span>
            <AdminStatusChip status={property.status} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Sale can only be recorded for properties in HOLDING
          </h2>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            This property is currently in <strong>{property.status}</strong> status. To record an
            exit sale and distribute returns to investors, the property must first complete
            fundraising (100% funded) and be moved into the <strong>HOLDING</strong> acquisition
            phase.
          </p>
        </div>

        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/admin/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Properties List</span>
          </Link>
        </div>
      </div>
    );
  }

  // Success Screen After Execution
  if (executedPayout) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-gray-900">
            Property Sale & Payout Completed!
          </h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Sale recorded at <strong>{safeFormatINR(executedPayout.salePrice)}</strong>. Payouts have
            been atomically credited to investor wallets, platform fees retained, and ledger entries recorded.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-left max-w-md mx-auto space-y-3.5 text-sm">
          <div className="flex justify-between pb-2 border-b border-gray-100">
            <span className="text-gray-500">Gross Sale Proceeds:</span>
            <span className="font-bold text-gray-900 font-mono">
              {safeFormatINR(executedPayout.salePrice)}
            </span>
          </div>
          <div className="flex justify-between pb-2 border-b border-gray-100">
            <span className="text-gray-500">Platform Fee Retained:</span>
            <span className="font-semibold text-amber-700 font-mono">
              {safeFormatINR(executedPayout.platformFee)}
            </span>
          </div>
          <div className="flex justify-between pb-2 border-b border-gray-100">
            <span className="text-gray-500">Net Distributable:</span>
            <span className="font-extrabold text-emerald-700 text-base font-mono">
              {safeFormatINR(executedPayout.distributable)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Investors Credited:</span>
            <span className="font-semibold text-gray-900">
              {executedPayout.items?.length || 0} Investors
            </span>
          </div>
        </div>

        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/admin/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span>View All Properties</span>
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <span>Go to Admin Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Navigation & Header */}
      <div>
        <Link
          href="/admin/properties"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Properties</span>
        </Link>
        <AdminPageHeader
          title="Record Property Sale"
          subtitle="Preview and execute final exit distributions with atomic wallet credits and fee deductions"
        />
      </div>

      {/* Property Summary Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{property.title}</h2>
              <AdminStatusChip status={property.status} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {property.city}, {property.state} • {property.type}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-gray-500 uppercase tracking-wider block">Initial Valuation</span>
            <span className="text-xl font-extrabold text-gray-900 font-mono">
              {formatINR(property.valuation)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <span className="text-gray-500 block">Total Units</span>
            <span className="font-bold text-gray-900 text-sm mt-0.5 block font-mono">
              {property.totalUnits?.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <span className="text-gray-500 block">Unit Price</span>
            <span className="font-bold text-gray-900 text-sm mt-0.5 block font-mono">
              {formatINR(property.unitPrice)}
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <span className="text-gray-500 block">Funding State</span>
            <span className="font-bold text-emerald-700 text-sm mt-0.5 block font-mono">
              {property.unitsSold} / {property.totalUnits} (100%)
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <span className="text-gray-500 block">Holding Period</span>
            <span className="font-bold text-gray-900 text-sm mt-0.5 block">
              {property.holdingPeriodMonths} Months
            </span>
          </div>
        </div>
      </div>

      {/* Sale Price Input Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div>
          <label
            htmlFor="sale-price-input"
            className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
          >
            Actual Sale Price in Rupees (₹) <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Enter the final gross sale amount in Indian Rupees. The preview updates automatically after 400ms of typing.
          </p>

          <div className="relative max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">
              ₹
            </span>
            <input
              id="sale-price-input"
              type="text"
              value={formattedDisplayPrice}
              onChange={handlePriceChange}
              placeholder="e.g. 1,40,00,000"
              className="w-full pl-9 pr-12 py-3 text-lg font-bold font-mono border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-300"
            />
            {loadingPreview && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Quick Test Examples:</span>
            <button
              type="button"
              onClick={() => {
                setRawRupees('14000000');
                setFormattedDisplayPrice('1,40,00,000');
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              ₹1.4 Cr (Standard +37.2% ROI)
            </button>
            <button
              type="button"
              onClick={() => {
                setRawRupees('10000000');
                setFormattedDisplayPrice('1,00,00,000');
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              ₹1.0 Cr (At Valuation)
            </button>
            <button
              type="button"
              onClick={() => {
                setRawRupees('8500000');
                setFormattedDisplayPrice('85,00,000');
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-50 hover:bg-red-100 text-red-700 transition-colors border border-red-200"
            >
              ₹85 L (Loss Case)
            </button>
          </div>
        </div>
      </div>

      {/* Fee & Distributable Preview Banner */}
      {preview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Gross Sale Price
            </span>
            <div className="text-xl font-extrabold text-gray-900 font-mono">
              {safeFormatINR(preview.salePrice)}
            </div>
            <span className="text-[11px] text-gray-400">Total transaction value</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Platform Fee
              </span>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-mono">
                {preview.platformFeePct}%
              </span>
            </div>
            <div className="text-xl font-extrabold text-amber-700 font-mono">
              - {safeFormatINR(preview.platformFee)}
            </div>
            <span className="text-[11px] text-amber-600/90">Deducted from proceeds</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Net Distributable to Investors
            </span>
            <div className="text-xl font-extrabold text-emerald-700 font-mono">
              {safeFormatINR(preview.distributable)}
            </div>
            <span className="text-[11px] text-emerald-600/90">Divided pro-rata among holders</span>
          </div>
        </div>
      )}

      {/* Preview Error */}
      {previewError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{previewError}</span>
        </div>
      )}

      {/* Payout Preview Table */}
      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-base">
              Investor Payout Breakdown
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              Calculated on {preview.items.length} Registered Investor{preview.items.length === 1 ? '' : 's'}
            </span>
          </div>

          <PayoutTable
            items={preview.items}
            distributable={preview.distributable}
            salePrice={preview.salePrice}
            valuation={property.valuation}
          />
        </div>
      )}

      {/* Action Footer Bar */}
      {preview && (
        <div className="sticky bottom-4 z-20 bg-white p-4 rounded-xl border border-gray-200 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-gray-500">Ready to execute?</div>
            <div className="text-sm font-semibold text-gray-900">
              {preview.items.length} investors will receive {safeFormatINR(preview.distributable)}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/admin/properties"
              className="px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-center w-full sm:w-auto"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => setConfirmModalOpen(true)}
              disabled={isExecuting || loadingPreview || !preview.sumCheck}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <DollarSign className="w-4 h-4" />
              <span>Confirm & Execute Payout</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirm Execution Modal */}
      {confirmModalOpen && preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-emerald-600">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Execute Property Sale & Payout
                  </h3>
                  <p className="text-xs text-gray-500">This action is irreversible</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">Property:</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[200px]">
                    {property.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gross Sale Price:</span>
                  <span className="font-bold text-gray-900">{safeFormatINR(preview.salePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform Fee:</span>
                  <span className="text-amber-700 font-semibold">- {safeFormatINR(preview.platformFee)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 text-sm">
                  <span className="font-bold text-gray-700">Total Investor Payout:</span>
                  <span className="font-extrabold text-emerald-700">{safeFormatINR(preview.distributable)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                By confirming, you will atomically credit the designated returns into all{' '}
                <strong className="text-gray-900">{preview.items.length} investor wallets</strong>,
                record ledger credit entries, and permanently mark the property status as{' '}
                <span className="font-bold text-primary">SOLD</span>.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={isExecuting}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSale}
                  disabled={isExecuting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Executing Payouts...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Yes, Execute Payout</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
