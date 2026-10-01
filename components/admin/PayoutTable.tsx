'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { PayoutItem } from '@/lib/api/admin';

// Safe INR formatter ensuring correct display even if shared util is loading
export function safeFormatINR(paise: number): string {
  if (typeof paise !== 'number' || isNaN(paise)) return '₹0';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

interface PayoutTableProps {
  items: PayoutItem[];
  distributable: number; // in paise
  salePrice: number; // in paise
  valuation: number; // in paise
}

export function PayoutTable({
  items,
  distributable,
  salePrice,
  valuation,
}: PayoutTableProps) {
  const sumOfPayouts = items.reduce((sum, item) => sum + item.amount, 0);
  const totalUnits = items.reduce((sum, item) => sum + item.units, 0);
  const totalInvested = items.reduce((sum, item) => sum + item.invested, 0);
  const totalOwnershipPct = items.reduce((sum, item) => sum + item.ownershipPct, 0);

  const isExactSumMatch = sumOfPayouts === distributable;
  const isLossCase = salePrice < valuation;

  return (
    <div className="space-y-4">
      {/* Loss Case Informational Note */}
      {isLossCase && (
        <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-sm">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-950">Loss Scenario Detected:</span>{' '}
            The recorded sale price ({safeFormatINR(salePrice)}) is lower than the initial property valuation ({safeFormatINR(valuation)}). 
            Investors will experience a loss on their capital, which is reflected as negative ROI below.
          </div>
        </div>
      )}

      {/* Sum of payouts Check Banner */}
      {isExactSumMatch ? (
        <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 flex items-center justify-between flex-wrap gap-2">
            <span>
              <strong>Sum of payouts = distributable ✓</strong> ({safeFormatINR(sumOfPayouts)})
            </span>
            <span className="text-xs bg-emerald-100/80 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-semibold">
              Exact Balance Guaranteed
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-300 rounded-xl text-red-900 text-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-red-950">
              CRITICAL MISMATCH: Sum of payouts does not equal distributable amount!
            </div>
            <div className="mt-1 text-xs space-y-0.5 font-mono">
              <p>Sum of Individual Payouts: {safeFormatINR(sumOfPayouts)} ({sumOfPayouts} paise)</p>
              <p>Distributable Target: {safeFormatINR(distributable)} ({distributable} paise)</p>
              <p className="font-bold text-red-700">
                Difference: {safeFormatINR(Math.abs(sumOfPayouts - distributable))} ({sumOfPayouts - distributable} paise)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table of Investors */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-700 font-semibold text-xs tracking-wider uppercase">
                <th className="py-3 px-4">Investor</th>
                <th className="py-3 px-4 text-right">Units Owned</th>
                <th className="py-3 px-4 text-right">Ownership %</th>
                <th className="py-3 px-4 text-right">Total Invested</th>
                <th className="py-3 px-4 text-right">Calculated Payout</th>
                <th className="py-3 px-4 text-right">ROI %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-tabular-nums">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No investors found for this property.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isNegative = item.roiPct < 0;
                  const isPositive = item.roiPct > 0;
                  return (
                    <tr
                      key={item.investorId}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {item.name || 'Investor'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {item.units.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {item.ownershipPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 font-medium">
                        {safeFormatINR(item.invested)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {safeFormatINR(item.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            isNegative
                              ? 'text-red-700 bg-red-50 border border-red-200'
                              : isPositive
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : 'text-gray-700 bg-gray-100'
                          }`}
                        >
                          {isNegative ? (
                            <>
                              <TrendingDown className="w-3 h-3 text-red-600" />
                              <span>-{Math.abs(item.roiPct).toFixed(1)}%</span>
                            </>
                          ) : isPositive ? (
                            <>
                              <TrendingUp className="w-3 h-3 text-emerald-600" />
                              <span>+{item.roiPct.toFixed(1)}%</span>
                            </>
                          ) : (
                            <span>0.0%</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Totals Row */}
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100/80 border-t-2 border-gray-300 font-bold text-gray-900">
                  <td className="py-3.5 px-4 text-xs tracking-wider uppercase">
                    Totals ({items.length} {items.length === 1 ? 'Investor' : 'Investors'})
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {totalUnits.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {totalOwnershipPct.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 text-right text-gray-800">
                    {safeFormatINR(totalInvested)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-primary text-base font-extrabold">
                    {safeFormatINR(sumOfPayouts)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-gray-500 text-xs">
                    —
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
