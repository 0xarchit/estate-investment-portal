import { ClientSession, Types } from "mongoose";
import { Notification, INotification } from "@/lib/server/models/Notification";

export interface NotifyPayload {
  type: string;
  title: string;
  body: string;
  link?: string;
}

export async function notify(
  userId: string | Types.ObjectId,
  payload: NotifyPayload,
  session?: ClientSession
): Promise<INotification> {
  const userObjectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  const [notif] = await Notification.create(
    [
      {
        userId: userObjectId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        link: payload.link,
        read: false,
      },
    ],
    { session }
  );

  return notif;
}
