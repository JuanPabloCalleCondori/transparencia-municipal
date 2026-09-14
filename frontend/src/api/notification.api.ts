import {
  apiRequest,
} from "./api";

import type {
  MarkAllNotificationsResponse,
  NotificationListResponse,
  NotificationMutationResponse,
  UnreadCountResponse,
  UnreadNotificationListResponse,
} from "../types/notification";


export async function getNotifications() {
  return apiRequest<NotificationListResponse>(
    "/notifications"
  );
}


export async function getUnreadNotifications() {
  return apiRequest<UnreadNotificationListResponse>(
    "/notifications/unread"
  );
}


export async function getUnreadNotificationCount() {
  return apiRequest<UnreadCountResponse>(
    "/notifications/unread/count"
  );
}


export async function markNotificationAsRead(
  idNotification: number
) {
  return apiRequest<NotificationMutationResponse>(
    `/notifications/${idNotification}/read`,
    {
      method: "PATCH",
    }
  );
}


export async function markAllNotificationsAsRead() {
  return apiRequest<MarkAllNotificationsResponse>(
    "/notifications/read-all",
    {
      method: "PATCH",
    }
  );
}