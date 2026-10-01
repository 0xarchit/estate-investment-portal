import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Ban,
  Building2,
  CheckCircle2,
  Circle,
  Clock3,
  FilePenLine,
  Hourglass,
  Info,
  Landmark,
  RotateCcw,
  ShieldCheck,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";

const styles = {
  grey: "bg-gray-100 text-gray-700",
  amber: "bg-amber-50 text-amber-900",
  blue: "bg-blue-50 text-blue-800",
  emerald: "bg-emerald-50 text-emerald-800",
  purple: "bg-purple-50 text-purple-800",
  navy: "bg-navy-50 text-navy",
  red: "bg-red-50 text-red-800",
  slate: "bg-slate-100 text-slate-700",
};

type StatusStyle = { tone: keyof typeof styles; icon: LucideIcon };
const statuses: Record<string, StatusStyle> = {
  DRAFT: { tone: "grey", icon: FilePenLine },
  PENDING_APPROVAL: { tone: "amber", icon: Clock3 },
  PENDING: { tone: "amber", icon: Clock3 },
  NOT_SUBMITTED: { tone: "amber", icon: Info },
  LIVE: { tone: "blue", icon: Building2 },
  FUNDED: { tone: "emerald", icon: BadgeCheck },
  HOLDING: { tone: "purple", icon: Hourglass },
  SOLD: { tone: "navy", icon: Landmark },
  REJECTED: { tone: "red", icon: XCircle },
  CANCELLED: { tone: "slate", icon: Ban },
  APPROVED: { tone: "emerald", icon: ShieldCheck },
  ACTIVE: { tone: "blue", icon: CheckCircle2 },
  EXITED: { tone: "navy", icon: Landmark },
  REFUNDED: { tone: "slate", icon: RotateCcw },
  COMPLETED: { tone: "emerald", icon: CheckCircle2 },
  PAID: { tone: "emerald", icon: CheckCircle2 },
  FAILED: { tone: "red", icon: XCircle },
  CREDIT: { tone: "emerald", icon: ArrowDownLeft },
  DEBIT: { tone: "red", icon: ArrowUpRight },
  TOPUP: { tone: "emerald", icon: Wallet },
  PAYOUT: { tone: "emerald", icon: ArrowDownLeft },
  REFUND: { tone: "emerald", icon: RotateCcw },
  COMMISSION: { tone: "emerald", icon: ArrowDownLeft },
  INVESTMENT: { tone: "blue", icon: Building2 },
  WITHDRAWAL: { tone: "slate", icon: ArrowUpRight },
  FEE: { tone: "slate", icon: ArrowUpRight },
};

export function StatusChip({ status }: { status: string }) {
  const { tone, icon: Icon } = statuses[status] ?? {
    tone: "slate",
    icon: Circle,
  };
  return (
    <span className={`status-chip ${styles[tone]}`}>
      <Icon size={12} aria-hidden="true" />
      {status.toLowerCase().replaceAll("_", " ")}
    </span>
  );
}
