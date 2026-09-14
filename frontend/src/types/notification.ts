export interface Notification {
  id_notificacion: number;
  id_usuario: number;

  titulo: string;
  mensaje: string;
  tipo: string;

  leida: boolean;

  fecha_creacion: string;
  fecha_lectura: string | null;
}


export interface NotificationListResponse {
  status: string;

  total: number;
  noLeidas: number;

  notificaciones: Notification[];
}


export interface UnreadNotificationListResponse {
  status: string;

  total: number;

  notificaciones: Notification[];
}


export interface UnreadCountResponse {
  status: string;
  noLeidas: number;
}


export interface NotificationMutationResponse {
  status: string;
  message: string;

  notificacion: Notification;
}


export interface MarkAllNotificationsResponse {
  status: string;
  message: string;

  actualizadas: number;
}
