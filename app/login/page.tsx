'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ChevronDown, ChevronUp, TrendingUp, Building2, ShieldCheck, Check } from 'lucide-react';

import { GuestOnly } from '@/lib/auth/RoleGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import { loginSchema, type LoginInput } from '@/lib/validators/auth';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormField, Input } from '@/components/auth/FormField';

const DEMO_CREDENTIALS = [
  { role: 'Admin', value: 'ADMIN', email: 'admin@demo.com', password: 'Admin@123' },
  { role: 'Broker (approved)', value: 'BROKER', email: 'rohit@demo.com', password: 'Broker@123' },
  { role: 'Broker (pending)', value: 'BROKER', email: 'newbroker@demo.com', password: 'Broker@123' },
  { role: 'Investor', value: 'INVESTOR', email: 'aman@demo.com', password: 'Investor@123' },
] as const;

const LOGIN_ROLES = [
  { value: 'INVESTOR', label: 'Investor', description: 'Build a portfolio', icon: TrendingUp },
  { value: 'BROKER', label: 'Broker', description: 'Manage listings', icon: Building2 },
  { value: 'ADMIN', label: 'Admin', description: 'Manage platform', icon: ShieldCheck },
] as const;

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');

  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { role: 'INVESTOR' } });
  const selectedRole = watch('role');
  const roleLabel = LOGIN_ROLES.find((item) => item.value === selectedRole)?.label ?? 'Investor';

  const onSubmit = async (data: LoginInput) => {
    setSubmitError(null);
    try {
      // GuestOnly owns the redirect, avoiding competing navigation effects.
      await login(data.email, data.password, data.role);
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Unable to sign in. Please try again.');
    }
  };

  return (
    <GuestOnly nextPath={nextPath}>
      <AuthCard
        title="Welcome back"
        subtitle="Choose your workspace and sign in to continue."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting} className="space-y-4">
          <fieldset disabled={isSubmitting} aria-describedby="login-role-hint">
            <legend className="mb-2 text-sm font-semibold text-navy">Login as</legend>
            <div className="grid grid-cols-3 gap-2">
              {LOGIN_ROLES.map(({ value, label, description, icon: Icon }) => (
                <label key={value} className="relative min-w-0 cursor-pointer">
                  <input className="peer sr-only" type="radio" value={value} {...register('role')} />
                  <span className="login-role flex h-full flex-col items-center gap-2 rounded-xl border border-slate-200 px-1 py-3 text-center text-slate-600 peer-checked:border-emerald-700 peer-checked:bg-emerald-50 peer-checked:text-emerald-900 peer-focus-visible:ring-2 peer-focus-visible:ring-navy peer-focus-visible:ring-offset-2 peer-disabled:opacity-60">
                    <Icon size={21} aria-hidden="true" />
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="hidden text-[10px] leading-4 sm:block">{description}</span>
                    {selectedRole === value && <Check size={12} aria-hidden="true" className="absolute right-2 top-2" />}
                  </span>
                </label>
              ))}
            </div>
            <p id="login-role-hint" className="mt-2 text-xs text-slate-600">Use the role assigned to your account.</p>
          </fieldset>
          {submitError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
          <FormField htmlFor="login-email" label="Email" error={errors.email?.message} required>
            <Input
              id="login-email"
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              disabled={isSubmitting}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={!!errors.email}
              {...register('email')}
            />
          </FormField>

          <FormField htmlFor="login-password" label="Password" error={errors.password?.message} required>
            <div className="relative">
              <Input
                id="login-password"
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                disabled={isSubmitting}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                error={!!errors.password}
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111827]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-emerald-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn w-full"
          >
            {isSubmitting ? 'Signing in…' : `Sign in as ${roleLabel}`}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-4 rounded-lg border border-dashed border-[#10B981]/40 bg-emerald-50/50">
          <button
            type="button"
            aria-expanded={showDemo}
            aria-controls="demo-credentials"
            onClick={() => setShowDemo((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-[#0F2A4A]"
          >
            Demo credentials (evaluator)
            {showDemo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showDemo && (
            <ul id="demo-credentials" className="divide-y divide-emerald-100 pb-2">
              {DEMO_CREDENTIALS.map((d) => (
                <li
                  key={d.email}
                  className="flex items-center justify-between px-3 py-1.5"
                >
                  <span className="text-xs text-[#6B7280]">{d.role}</span>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setValue('email', d.email);
                      setValue('password', d.password);
                      setValue('role', d.value);
                      setSubmitError(null);
                    }}
                    className="min-h-11 rounded px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-100"
                  >
                    {d.email}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-[#6B7280]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-emerald-700 hover:underline">
            Sign up
          </Link>
        </p>
      </AuthCard>
    </GuestOnly>
  );
}



export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
