'use client';

import React from 'react';

interface Props {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

/**
 * Accessible form field wrapper: label + input slot + error message.
 */
export function FormField({ label, error, required, children, hint }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-[#111827]">
        {label}
        {required && (
          <span className="ml-0.5 text-[#DC2626]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-[#6B7280]">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-[#DC2626]">
          {error}
        </p>
      )}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-lg border px-3 py-2.5 text-sm text-[#111827] outline-none',
        'placeholder:text-[#6B7280]',
        'focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981]',
        'transition-colors',
        error
          ? 'border-[#DC2626] bg-red-50'
          : 'border-gray-200 bg-white hover:border-gray-300',
        className,
      ].join(' ')}
    />
  );
}
