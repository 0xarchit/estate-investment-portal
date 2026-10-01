import {
  LayoutDashboard,
  Store,
  Briefcase,
  Wallet,
  FileText,
  Bell,
} from "lucide-react";
import { NavItem } from "@/components/layout/DashboardLayout";

export const investorNav: NavItem[] = [
  { label: "Dashboard", href: "/investor", icon: LayoutDashboard },
  { label: "Marketplace", href: "/properties", icon: Store },
  { label: "Portfolio", href: "/investor/portfolio", icon: Briefcase },
  { label: "Wallet", href: "/investor/wallet", icon: Wallet },
  { label: "KYC Verification", href: "/investor/kyc", icon: FileText },
  { label: "Notifications", href: "/notifications", icon: Bell },
];
