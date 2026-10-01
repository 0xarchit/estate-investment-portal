'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

import { GuestOnly, roleHome } from '@/lib/auth/RoleGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import { loginSchema, type LoginInput } from '@/lib/validators/auth';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormField, Input } from '@/components/auth/FormField';

const DEMO_CREDENTIALS = [
  { role: 'Admin', email: 'admin@demo.com', password: 'Admin@123' },
  { role: 'Broker (approved)', email: 'rohit@demo.com', password: 'Broker@123' },
  { role: 'Broker (pending)', email: 'newbroker@demo.com', password: 'Broker@123' },
  { role: 'Investor', email: 'aman@demo.com', password: 'Investor@123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');

  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    try {
      const user = await login(data.email, data.password);
      const dest = nextPath ?? roleHome(user.role);
      router.replace(dest);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message === 'DEACTIVATED'
          ? 'Your account has been deactivated. Contact support.'
          : 'Invalid email or password';
      toast.error(msg);
    }
  };

  return (
    <GuestOnly>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to your account to continue"
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

          <FormField label="Password" error={errors.password?.message} required>
            <div className="relative">
              <Input
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
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-[#10B981] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#10B981] py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-4 rounded-lg border border-dashed border-[#10B981]/40 bg-emerald-50/50">
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-[#0F2A4A]"
          >
            Demo credentials (evaluator)
            {showDemo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showDemo && (
            <ul className="divide-y divide-emerald-100 pb-2">
              {DEMO_CREDENTIALS.map((d) => (
                <li
                  key={d.email}
                  className="flex items-center justify-between px-3 py-1.5"
                >
                  <span className="text-xs text-[#6B7280]">{d.role}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', d.email);
                      setValue('password', d.password);
                    }}
                    className="rounded px-2 py-0.5 text-xs text-[#10B981] hover:bg-emerald-100"
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
          <Link href="/signup" className="font-medium text-[#10B981] hover:underline">
            Sign up
          </Link>
        </p>
      </AuthCard>
    </GuestOnly>
  );
}
