import {
  LayoutDashboard,
  Building2,
  PlusSquare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export const brokerNav: NavItem[] = [
  { label: 'Dashboard', href: '/broker', icon: LayoutDashboard },
  { label: 'My Properties', href: '/broker/properties', icon: Building2 },
  { label: 'New Listing', href: '/broker/properties/new', icon: PlusSquare },
];
