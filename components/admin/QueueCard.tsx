'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface QueueCardProps {
  title: string;
  count: number;
  description: string;
  href: string;
  icon: LucideIcon;
  badgeTone?: 'warning' | 'info' | 'danger' | 'success';
}

export function QueueCard({
  title,
  count,
  description,
  href,
  icon: Icon,
  badgeTone = 'warning',
}: QueueCardProps) {
  const toneClasses = {
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      btn: 'hover:bg-amber-50 text-amber-700 border-amber-300',
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100 text-blue-700',
      btn: 'hover:bg-blue-50 text-blue-700 border-blue-300',
    },
    danger: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      iconBg: 'bg-red-100 text-red-700',
      btn: 'hover:bg-red-50 text-red-700 border-red-300',
    },
    success: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-700',
      btn: 'hover:bg-emerald-50 text-emerald-700 border-emerald-300',
    },
  }[badgeTone];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className={`p-2.5 rounded-lg ${toneClasses.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${toneClasses.bg} ${toneClasses.text} ${toneClasses.border}`}
          >
            {count} {count === 1 ? 'Pending' : 'Pending'}
          </span>
        </div>

        <h3 className="mt-4 font-semibold text-gray-900 text-base">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
      </div>

      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">Action Required</span>
        <Link
          href={href}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${toneClasses.btn}`}
        >
          <span>Review</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
