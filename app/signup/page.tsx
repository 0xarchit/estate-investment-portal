'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

import { GuestOnly, roleHome } from '@/lib/auth/RoleGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import { registerSchema, type RegisterInput } from '@/lib/validators/auth';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormField, Input } from '@/components/auth/FormField';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

type RoleToggle = 'INVESTOR' | 'BROKER';

export default function SignupPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<RoleToggle>('INVESTOR');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'INVESTOR' },
  });

  const password = watch('password') ?? '';

  const handleRoleToggle = (r: RoleToggle) => {
    setRole(r);
    setValue('role', r);
  };

  const onSubmit = async (data: RegisterInput) => {
    try {
      const user = await registerUser(data);
      toast.success('Account created! Welcome.');
      router.replace(roleHome(user.role));
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const msg =
        code === 'CONFLICT'
          ? 'An account with that email already exists.'
          : (err as { message?: string })?.message ?? 'Registration failed. Try again.';
      toast.error(msg);
    }
  };

  return (
    <GuestOnly>
      <AuthCard
        title="Create an account"
        subtitle="Start investing in fractional real estate"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Role toggle */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-[#111827]">I am a</p>
            <div className="flex rounded-lg border border-gray-200 p-0.5">
              {(['INVESTOR', 'BROKER'] as RoleToggle[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleToggle(r)}
                  className={[
                    'flex-1 rounded-md py-2 text-sm font-medium transition',
                    role === r
                      ? 'bg-[#0F2A4A] text-white'
                      : 'text-[#6B7280] hover:text-[#111827]',
                  ].join(' ')}
                >
                  {r === 'INVESTOR' ? 'Investor' : 'Broker / Agent'}
                </button>
              ))}
            </div>
            {role === 'BROKER' && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Your account needs admin approval before you can list properties.
              </p>
            )}
          </div>

          {/* Hidden role field */}
          <input type="hidden" {...register('role')} />

          <FormField label="Full name" error={errors.name?.message} required>
            <Input
              type="text"
              autoComplete="name"
              placeholder="Arjun Sharma"
              error={!!errors.name}
              {...register('name')}
            />
          </FormField>

          <FormField label="Email" error={errors.email?.message} required>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={!!errors.email}
              {...register('email')}
            />
          </FormField>

          <FormField
            label="Phone"
            error={errors.phone?.message}
            required
            hint="10-digit Indian mobile number"
          >
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="9876543210"
              maxLength={10}
              error={!!errors.phone}
              {...register('phone')}
            />
          </FormField>

          <FormField label="Password" error={errors.password?.message} required>
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#6B7280]">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#10B981] hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </GuestOnly>
  );
}
