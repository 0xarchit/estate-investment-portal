'use client';

import { ReactNode } from 'react';
import { brokerNav } from '@/components/broker/nav';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/lib/auth/RoleGuard';

export default function BrokerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={['BROKER']}>
      <DashboardLayout nav={brokerNav} roleLabel="Broker">
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
