'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, User } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/lib/auth/AuthContext';
import { RoleGuard } from '@/lib/auth/RoleGuard';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validators/auth';
import { changePasswordApi } from '@/lib/api/auth';
import { FormField, Input } from '@/components/auth/FormField';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  BROKER: 'Broker / Agent',
  INVESTOR: 'Investor',
};

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch('newPassword') ?? '';

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      await changePasswordApi({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password updated successfully.');
      reset();
      await refreshUser();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const msg =
        code === 'UNAUTHENTICATED'
          ? 'Current password is incorrect.'
          : (err as { message?: string })?.message ?? 'Failed to update password.';
      toast.error(msg);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8 px-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">My Profile</h1>
        <p className="text-sm text-[#6B7280]">Manage your account details</p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0F2A4A] text-white">
            <User size={28} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">{user.name}</h2>
            <p className="text-sm text-[#6B7280]">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Role</p>
            <p className="mt-1 text-sm font-semibold text-[#111827]">
              {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Phone</p>
            <p className="mt-1 text-sm text-[#111827]">{user.phone}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Account status</p>
            <p className="mt-1 text-sm text-[#111827]">
              {user.isActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  Deactivated
                </span>
              )}
            </p>
          </div>
          {user.role === 'BROKER' && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                Broker status
              </p>
              <p className="mt-1 text-sm">
                {user.brokerApproved ? (
                  <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Pending approval
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h3 className="mb-4 text-base font-semibold text-[#111827]">Change password</h3>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField label="Current password" error={errors.currentPassword?.message} required>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                error={!!errors.currentPassword}
                className="pr-10"
                {...register('currentPassword')}
              />
              <button
                type="button"
                aria-label="Toggle current password visibility"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          <FormField label="New password" error={errors.newPassword?.message} required>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                error={!!errors.newPassword}
                className="pr-10"
                {...register('newPassword')}
              />
              <button
                type="button"
                aria-label="Toggle new password visibility"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={newPassword} />
          </FormField>

          <FormField
            label="Confirm new password"
            error={errors.confirmNewPassword?.message}
            required
          >
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                error={!!errors.confirmNewPassword}
                className="pr-10"
                {...register('confirmNewPassword')}
              />
              <button
                type="button"
                aria-label="Toggle confirm password visibility"
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
            className="rounded-lg bg-[#0F2A4A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F2A4A]/90 disabled:opacity-60"
          >
            {isSubmitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RoleGuard roles={['ADMIN', 'BROKER', 'INVESTOR']}>
      <ProfileContent />
    </RoleGuard>
  );
}
