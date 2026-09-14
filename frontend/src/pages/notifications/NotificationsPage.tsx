import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../api/notification.api";

import type {
  Notification,
} from "../../types/notification";

import "./NotificationsPage.css";


type NotificationFilter =
  | "TODAS"
  | "NO_LEIDAS";


function formatDateTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}


function formatNotificationType(
  type: string
) {
  return type
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}


function getNotificationIcon(
  type: string
) {
  switch (type) {
    case "URGENTE":
      return "!";

    case "ADVERTENCIA":
      return "⚠";

    case "ASIGNACION":
      return "→";

    case "PLAZO":
      return "⏱";

    case "RECORDATORIO":
      return "⏰";

    case "TRANSPARENCIA":
      return "T";

    case "TAREA":
      return "✓";

    default:
      return "i";
  }
}


export default function NotificationsPage() {

  const [
    notifications,
    setNotifications,
  ] = useState<
    Notification[]
  >([]);


  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);


  const [
    filter,
    setFilter,
  ] = useState<
    NotificationFilter
  >("TODAS");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    markingId,
    setMarkingId,
  ] = useState<
    number | null
  >(null);


  const [
    markingAll,
    setMarkingAll,
  ] = useState(false);


  const loadNotifications =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getNotifications();

          setNotifications(
            response.notificaciones
          );

          setUnreadCount(
            response.noLeidas
          );

        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar las notificaciones."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);


  const filteredNotifications =
    useMemo(
      () => {
        if (
          filter ===
          "NO_LEIDAS"
        ) {
          return notifications.filter(
            (notification) =>
              !notification.leida
          );
        }

        return notifications;
      },
      [
        notifications,
        filter,
      ]
    );


  const readCount =
    notifications.length -
    unreadCount;


  async function handleMarkAsRead(
    notification:
      Notification
  ) {
    if (
      notification.leida
    ) {
      return;
    }

    try {
      setMarkingId(
        notification
          .id_notificacion
      );

      setError("");
      setSuccess("");

      await markNotificationAsRead(
        notification
          .id_notificacion
      );

      setNotifications(
        (previous) =>
          previous.map(
            (item) =>
              item.id_notificacion ===
              notification.id_notificacion
                ? {
                    ...item,
                    leida: true,
                    fecha_lectura:
                      new Date()
                        .toISOString(),
                  }
                : item
          )
      );

      setUnreadCount(
        (previous) =>
          Math.max(
            0,
            previous - 1
          )
      );

      setSuccess(
        "Notificación marcada como leída."
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible marcar la notificación."
      );
    } finally {
      setMarkingId(
        null
      );
    }
  }


  async function handleMarkAllAsRead() {

    if (
      unreadCount === 0
    ) {
      return;
    }


    try {
      setMarkingAll(true);

      setError("");
      setSuccess("");

      const response =
        await markAllNotificationsAsRead();


      setNotifications(
        (previous) =>
          previous.map(
            (notification) => ({
              ...notification,

              leida: true,

              fecha_lectura:
                notification
                  .fecha_lectura ??
                new Date()
                  .toISOString(),
            })
          )
      );


      setUnreadCount(0);


      setSuccess(
        `${response.actualizadas} notificación(es) marcada(s) como leída(s).`
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible marcar todas las notificaciones."
      );
    } finally {
      setMarkingAll(false);
    }
  }


  return (
    <div className="notifications-page">

      <div className="notifications-page-header">

        <div>
          <h1>
            Notificaciones
          </h1>

          <p>
            Avisos y alertas asociados
            a solicitudes, tareas,
            plazos y Transparencia
            Activa.
          </p>
        </div>


        <button
          type="button"
          className="notifications-primary-button"
          onClick={
            handleMarkAllAsRead
          }
          disabled={
            unreadCount === 0 ||
            markingAll
          }
        >
          {markingAll
            ? "Procesando..."
            : "Marcar todas como leídas"}
        </button>

      </div>


      <div className="notifications-summary">

        <article className="notifications-summary-card">

          <span>
            Total
          </span>

          <strong>
            {notifications.length}
          </strong>

        </article>


        <article className="notifications-summary-card">

          <span>
            No leídas
          </span>

          <strong>
            {unreadCount}
          </strong>

        </article>


        <article className="notifications-summary-card">

          <span>
            Leídas
          </span>

          <strong>
            {readCount}
          </strong>

        </article>

      </div>


      {success && (
        <div className="notifications-success">
          {success}
        </div>
      )}


      {error && (
        <div className="notifications-error">
          {error}
        </div>
      )}


      <section className="notifications-card">

        <div className="notifications-toolbar">

          <div className="notifications-tabs">

            <button
              type="button"
              className={
                filter === "TODAS"
                  ? "notifications-tab notifications-tab-active"
                  : "notifications-tab"
              }
              onClick={() =>
                setFilter(
                  "TODAS"
                )
              }
            >
              Todas
            </button>


            <button
              type="button"
              className={
                filter ===
                "NO_LEIDAS"
                  ? "notifications-tab notifications-tab-active"
                  : "notifications-tab"
              }
              onClick={() =>
                setFilter(
                  "NO_LEIDAS"
                )
              }
            >
              No leídas

              {unreadCount >
                0 && (
                <span className="notifications-tab-count">
                  {unreadCount}
                </span>
              )}
            </button>

          </div>

        </div>


        {loading ? (
          <div className="notifications-message">
            Cargando notificaciones...
          </div>

        ) : filteredNotifications.length ===
          0 ? (
          <div className="notifications-empty">

            <strong>
              Sin notificaciones
            </strong>

            <span>
              {filter ===
              "NO_LEIDAS"
                ? "No tienes notificaciones pendientes de lectura."
                : "Todavía no tienes notificaciones registradas."}
            </span>

          </div>

        ) : (
          <div className="notifications-list">

            {filteredNotifications.map(
              (notification) => (

                <article
                  key={
                    notification
                      .id_notificacion
                  }
                  className={
                    notification
                      .leida
                      ? "notification-item"
                      : "notification-item notification-item-unread"
                  }
                >

                  <div
                    className={
                      `notification-icon notification-icon-${notification.tipo.toLowerCase()}`
                    }
                  >
                    {getNotificationIcon(
                      notification.tipo
                    )}
                  </div>


                  <div className="notification-content">

                    <div className="notification-content-top">

                      <div>

                        <div className="notification-title-row">

                          <h3>
                            {
                              notification
                                .titulo
                            }
                          </h3>


                          {!notification
                            .leida && (
                            <span className="notification-unread-dot" />
                          )}

                        </div>


                        <span className="notification-type">
                          {formatNotificationType(
                            notification.tipo
                          )}
                        </span>

                      </div>


                      <time>
                        {formatDateTime(
                          notification
                            .fecha_creacion
                        )}
                      </time>

                    </div>


                    <p>
                      {
                        notification
                          .mensaje
                      }
                    </p>


                    <div className="notification-footer">

                      <span
                        className={
                          notification
                            .leida
                            ? "notification-read-state notification-read"
                            : "notification-read-state notification-unread"
                        }
                      >
                        {notification
                          .leida
                          ? "Leída"
                          : "No leída"}
                      </span>


                      {!notification
                        .leida && (
                        <button
                          type="button"
                          className="notification-read-button"
                          disabled={
                            markingId ===
                            notification
                              .id_notificacion
                          }
                          onClick={() =>
                            handleMarkAsRead(
                              notification
                            )
                          }
                        >
                          {markingId ===
                          notification
                            .id_notificacion
                            ? "Procesando..."
                            : "Marcar como leída"}
                        </button>
                      )}

                    </div>

                  </div>

                </article>

              )
            )}

          </div>
        )}

      </section>

    </div>
  );
}
