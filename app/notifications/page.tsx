"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, LayoutDashboard, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { RoleGuard, roleHome } from "@/lib/auth/RoleGuard";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/lib/api/notifications";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { investorNav } from "@/components/investor/nav";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/format";
import { errorMessage } from "@/components/investor/common";
export default function Notifications() {
  const { user } = useAuth();
  const nav =
    user?.role === "INVESTOR"
      ? investorNav
      : [
          {
            label: "Dashboard",
            href: roleHome(user?.role ?? "INVESTOR"),
            icon: LayoutDashboard,
          },
          { label: "Notifications", href: "/notifications", icon: Bell },
        ];
  return (
    <RoleGuard roles={["INVESTOR", "ADMIN", "BROKER"]}>
      <DashboardLayout
        nav={nav}
        roleLabel={
          user?.role === "ADMIN"
            ? "Admin"
            : user?.role === "BROKER"
              ? "Broker"
              : "Investor"
        }
      >
        <NotificationContent />
      </DashboardLayout>
    </RoleGuard>
  );
}
function NotificationContent() {
  const router = useRouter();
  const client = useQueryClient();
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: !!user,
  });
  const [unread, setUnread] = useState(false);
  const [limit, setLimit] = useState(20);
  const read = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (error) => toast.error(errorMessage(error)),
  });
  const all = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (error) => toast.error(errorMessage(error)),
  });
  function open(item: Notification) {
    if (!item.read) read.mutate(item._id);
    if (item.link && item.link.startsWith("/") && !item.link.startsWith("//"))
      router.push(item.link);
  }
  const items = (query.data?.items ?? []).filter(
    (item) => !unread || !item.read,
  );
  const visible = items.slice(0, limit);
  const today = new Date().toDateString();
  return (
    <div className="page-stack">
      <PageHeader
        title="Notifications"
        subtitle="The latest on your properties, funds and account."
        actions={
          <button
            className="btn-secondary"
            disabled={all.isPending || !query.data?.unreadCount}
            onClick={() => all.mutate()}
          >
            <CheckCheck className="h-4 w-4" />
            {all.isPending ? "Updating…" : "Mark all as read"}
          </button>
        }
      />
      <div className="flex gap-2">
        <button
          className={!unread ? "btn" : "btn-secondary"}
          aria-pressed={!unread}
          onClick={() => {
            setUnread(false);
            setLimit(20);
          }}
        >
          All notifications
        </button>
        <button
          className={unread ? "btn" : "btn-secondary"}
          aria-pressed={unread}
          onClick={() => {
            setUnread(true);
            setLimit(20);
          }}
        >
          Unread ({query.data?.unreadCount ?? 0})
        </button>
      </div>
      {query.isPending ? (
        <PageSkeleton />
      ) : query.isError ? (
        <ErrorState
          message={errorMessage(query.error)}
          onRetry={() => query.refetch()}
        />
      ) : !visible.length ? (
        <EmptyState
          title="You're all caught up"
          description="Updates about your account will appear here."
        />
      ) : (
        <>
          {["Today", "Earlier"].map((group) => {
            const entries = visible.filter(
              (item) =>
                (new Date(item.createdAt).toDateString() === today) ===
                (group === "Today"),
            );
            return entries.length ? (
              <section key={group}>
                <h2 className="mb-3 text-sm font-semibold text-slate-500">
                  {group}
                </h2>
                <ul className="panel divide-y divide-slate-100 overflow-hidden">
                  {entries.map((item) => (
                    <li
                      key={item._id}
                      className={`flex flex-wrap items-start gap-3 p-5 sm:flex-nowrap ${item.read ? "" : "border-l-4 border-l-emerald-700 bg-emerald-50/40"}`}
                    >
                      <Bell className="mt-1 h-5 w-5 shrink-0 text-emerald-800" />
                      <div className="min-w-0 flex-1">
                        <button
                          className="text-left font-semibold hover:underline"
                          onClick={() => open(item)}
                        >
                          {item.title}
                          {!item.read && (
                            <span className="ml-2 text-xs font-medium text-emerald-800">
                              Unread
                            </span>
                          )}
                        </button>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {item.body}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {formatDate(item.createdAt)} ·{" "}
                          {item.type.toLowerCase()}
                        </p>
                      </div>
                      {!item.read && (
                        <button
                          className="text-xs font-semibold text-emerald-800 hover:underline"
                          disabled={read.isPending}
                          onClick={() => read.mutate(item._id)}
                        >
                          Mark read
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null;
          })}
          {items.length > limit && (
            <button
              className="btn-secondary"
              onClick={() => setLimit(limit + 20)}
            >
              Load more
            </button>
          )}
          <p className="text-xs text-slate-500">
            Showing up to the latest 50 notifications.
          </p>
        </>
      )}
    </div>
  );
}
