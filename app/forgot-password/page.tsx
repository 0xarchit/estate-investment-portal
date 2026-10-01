'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

import { GuestOnly } from '@/lib/auth/RoleGuard';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validators/auth';
import { forgotPasswordApi } from '@/lib/api/auth';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormField, Input } from '@/components/auth/FormField';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      await forgotPasswordApi(data.email);
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      toast.error('Something went wrong. Please try again.');
    }
  };

  if (sent) {
    return (
      <GuestOnly>
        <AuthCard title="Check your inbox">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle className="h-12 w-12 text-[#10B981]" />
            <p className="text-sm text-[#6B7280]">
              If that email is registered, we&apos;ve sent a reset link. Check your inbox
              and spam folder.
            </p>
            <Link
              href="/login"
              className="text-sm font-medium text-[#10B981] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </AuthCard>
      </GuestOnly>
    );
  }

  return (
    <GuestOnly>
      <AuthCard
        title="Forgot password"
        subtitle="Enter your email and we'll send a reset link"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField label="Email" error={errors.email?.message} required>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={!!errors.email}
              {...register('email')}
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#10B981] py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#6B7280]">
          Remember it?{' '}
          <Link href="/login" className="font-medium text-[#10B981] hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </GuestOnly>
  );
}
