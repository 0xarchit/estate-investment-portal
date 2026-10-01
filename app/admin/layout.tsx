'use client';

import { ReactNode } from 'react';
import { adminNav } from '@/components/admin/nav';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/lib/auth/RoleGuard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={['ADMIN']}>
      <DashboardLayout nav={adminNav} roleLabel="Admin">
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
