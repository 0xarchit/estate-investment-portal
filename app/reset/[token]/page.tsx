'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { GuestOnly } from '@/lib/auth/RoleGuard';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validators/auth';
import { resetPasswordApi } from '@/lib/api/auth';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormField, Input } from '@/components/auth/FormField';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

export default function ResetPasswordPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password') ?? '';

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      await resetPasswordApi(token, data.password);
      setDone(true);
      setTimeout(() => router.replace('/login'), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Link expired or invalid. Request a new one.';
      toast.error(msg);
    }
  };

  if (done) {
    return (
      <GuestOnly>
        <AuthCard title="Password reset">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle className="h-12 w-12 text-[#10B981]" />
            <p className="text-sm text-[#6B7280]">
              Your password has been updated. Redirecting to sign in…
            </p>
            <Link href="/login" className="text-sm font-medium text-[#10B981] hover:underline">
              Sign in now
            </Link>
          </div>
        </AuthCard>
      </GuestOnly>
    );
  }

  return (
    <GuestOnly>
      <AuthCard title="Set new password" subtitle="Choose a strong password">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField label="New password" error={errors.password?.message} required>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                error={!!errors.password}
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide' : 'Show'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </FormField>

          <FormField
            label="Confirm password"
            error={errors.confirmPassword?.message}
            required
          >
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                error={!!errors.confirmPassword}
                className="pr-10"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                aria-label={showConfirm ? 'Hide' : 'Show'}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#10B981] py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {isSubmitting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </AuthCard>
    </GuestOnly>
  );
}
