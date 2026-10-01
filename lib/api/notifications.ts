import { api, unwrap } from "./client";
export interface Notification {
  _id: string;
  title: string;
  body: string;
  type: string;
  link?: string;
  read: boolean;
  createdAt: string;
}
export const getNotifications = () =>
  unwrap<{ items: Notification[]; unreadCount: number }>(
    api.get("/notifications"),
  );
export const markNotificationRead = (id: string) =>
  unwrap<unknown>(api.patch(`/notifications/${id}/read`));
export const markAllNotificationsRead = () =>
  unwrap<unknown>(api.patch("/notifications/read-all"));
