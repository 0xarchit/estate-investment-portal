import {
  LayoutDashboard,
  Building2,
  Users,
  FileCheck,
  ArrowDownToLine,
  Settings,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export const adminNav: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Properties',
    href: '/admin/properties',
    icon: Building2,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'KYC Queue',
    href: '/admin/kyc',
    icon: FileCheck,
  },
  {
    label: 'Withdrawals',
    href: '/admin/withdrawals',
    icon: ArrowDownToLine,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];
