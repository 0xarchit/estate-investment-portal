"use client";

import { ReactNode } from "react";
import { investorNav } from "@/components/investor/nav";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/lib/auth/RoleGuard";

export default function InvestorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["INVESTOR"]}>
      <DashboardLayout nav={investorNav} roleLabel="Investor">
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
