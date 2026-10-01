'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, TrendingUp, Building2, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { GuestOnly } from '@/lib/auth/RoleGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import { registerSchema, type RegisterInput } from '@/lib/validators/auth';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormField, Input } from '@/components/auth/FormField';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

export default function SignupPage() {
  const { register: registerUser } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'INVESTOR' },
  });

  const password = watch('password') ?? '';

  const role = watch('role');

  const onSubmit = async (data: RegisterInput) => {
    setSubmitError(null);
    try {
      await registerUser(data);
      toast.success('Account created! Welcome.');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const msg =
        code === 'CONFLICT'
          ? 'An account with that email already exists.'
          : (err as { message?: string })?.message ?? 'Registration failed. Try again.';
      setSubmitError(msg);
    }
  };

  return (
    <GuestOnly>
      <AuthCard
        variant="signup"
        title="Create an account"
        subtitle="Start investing in fractional real estate"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting} className="space-y-5">
          <fieldset disabled={isSubmitting} aria-describedby="signup-role-hint">
            <legend className="mb-2 text-sm font-semibold text-navy">Create your workspace</legend>
            <div className="grid grid-cols-2 gap-3">
              {([{ value: 'INVESTOR', label: 'Investor', icon: TrendingUp, detail: 'Build your portfolio' }, { value: 'BROKER', label: 'Broker / Agent', icon: Building2, detail: 'List your properties' }] as const).map(({ value, label, icon: Icon, detail }) => (
                <label key={value} className="cursor-pointer min-w-0">
                  <input className="peer sr-only" type="radio" value={value} {...register('role')} />
                  <span className="signup-role flex flex-col gap-2 rounded-xl border border-slate-200 p-3 text-slate-600 peer-checked:border-emerald-700 peer-checked:bg-emerald-50 peer-checked:text-emerald-900 peer-focus-visible:ring-2 peer-focus-visible:ring-navy peer-focus-visible:ring-offset-2">
                    <Icon size={21} aria-hidden="true" />
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-xs">{detail}</span>
                  </span>
                </label>
              ))}
            </div>
            <p id="signup-role-hint" className="mt-2 text-xs leading-5 text-slate-600">{role === 'BROKER' ? 'Admin approval is required before you can list properties.' : 'Explore fractional ownership and track your investments.'}</p>
          </fieldset>
          {submitError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}

          <FormField htmlFor="signup-name" label="Full name" error={errors.name?.message} required>
            <Input
              type="text"
              autoComplete="name"
              placeholder="Arjun Sharma"
              error={!!errors.name}
              id="signup-name"
                disabled={isSubmitting}
                aria-describedby={errors.name ? 'signup-name-error' : undefined}
                {...register('name', { setValueAs: (value: string) => value.trim() })}
            />
          </FormField>

          <FormField htmlFor="signup-email" label="Email" error={errors.email?.message} required>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={!!errors.email}
              id="signup-email"
                disabled={isSubmitting}
                aria-describedby={errors.email ? 'signup-email-error' : undefined}
                {...register('email', { setValueAs: (value: string) => value.trim() })}
            />
          </FormField>

          <FormField
            htmlFor="signup-phone" label="Phone"
            error={errors.phone?.message}
            required
            hint="10-digit Indian mobile number"
          >
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="9876543210"
              maxLength={10}
              inputMode="numeric"
              error={!!errors.phone}
              id="signup-phone"
                disabled={isSubmitting}
                aria-describedby={errors.phone ? 'signup-phone-error' : 'signup-phone-hint'}
                {...register('phone')}
            />
          </FormField>

          <FormField htmlFor="signup-password" label="Password" error={errors.password?.message} required>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                error={!!errors.password}
                className="pr-12"
                id="signup-password"
                disabled={isSubmitting}
                aria-describedby={errors.password ? 'signup-password-error' : undefined}
                {...register('password')}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isSubmitting}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </FormField>

          <FormField
            htmlFor="signup-confirmPassword" label="Confirm password"
            error={errors.confirmPassword?.message}
            required
          >
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                error={!!errors.confirmPassword}
                className="pr-12"
                id="signup-confirmPassword"
                disabled={isSubmitting}
                aria-describedby={errors.confirmPassword ? 'signup-confirmPassword-error' : undefined}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirm}
                disabled={isSubmitting}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn signup-submit w-full"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
            {isSubmitting ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
          </button>
        </form>

        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">Practice with a simulated wallet. This demo never processes real payments.</p>
        <p className="mt-4 text-center text-sm text-[#6B7280]">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-emerald-700 hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </GuestOnly>
  );
}
