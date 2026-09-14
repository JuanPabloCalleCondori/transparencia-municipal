import type {
  Request,
  Response,
} from "express";

import {
  getNotificationsByUser,
  countUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service.js";


function getAuthenticatedUserId(
  req: Request
): number | null {
  const idUsuario =
    req.user?.idUsuario;

  if (
    !idUsuario ||
    !Number.isInteger(idUsuario)
  ) {
    return null;
  }

  return idUsuario;
}


function handleNotificationError(
  error: unknown,
  res: Response
) {
  if (
    error instanceof Error &&
    error.message ===
      "NOTIFICACION_NO_ENCONTRADA"
  ) {
    return res.status(404).json({
      status: "error",
      message:
        "Notificación no encontrada",
    });
  }

  console.error(
    "Error en notificaciones:",
    error
  );

  return res.status(500).json({
    status: "error",
    message:
      "Error interno del servidor",
  });
}


/* =========================================================
   TODAS
   ========================================================= */

export async function listNotifications(
  req: Request,
  res: Response
) {
  try {
    const idUsuario =
      getAuthenticatedUserId(req);

    if (!idUsuario) {
      return res.status(401).json({
        status: "error",
        message:
          "Usuario no autenticado",
      });
    }

    const notificaciones =
      await getNotificationsByUser(
        idUsuario
      );

    const noLeidas =
      await countUnreadNotifications(
        idUsuario
      );

    return res.status(200).json({
      status: "ok",

      total:
        notificaciones.length,

      noLeidas,

      notificaciones,
    });
  } catch (error) {
    return handleNotificationError(
      error,
      res
    );
  }
}


/* =========================================================
   SOLO NO LEÍDAS
   ========================================================= */

export async function listUnreadNotifications(
  req: Request,
  res: Response
) {
  try {
    const idUsuario =
      getAuthenticatedUserId(req);

    if (!idUsuario) {
      return res.status(401).json({
        status: "error",
        message:
          "Usuario no autenticado",
      });
    }

    const notificaciones =
      await getNotificationsByUser(
        idUsuario,
        true
      );

    return res.status(200).json({
      status: "ok",

      total:
        notificaciones.length,

      notificaciones,
    });
  } catch (error) {
    return handleNotificationError(
      error,
      res
    );
  }
}


/* =========================================================
   CONTADOR
   ========================================================= */

export async function unreadCount(
  req: Request,
  res: Response
) {
  try {
    const idUsuario =
      getAuthenticatedUserId(req);

    if (!idUsuario) {
      return res.status(401).json({
        status: "error",
        message:
          "Usuario no autenticado",
      });
    }

    const total =
      await countUnreadNotifications(
        idUsuario
      );

    return res.status(200).json({
      status: "ok",
      noLeidas: total,
    });
  } catch (error) {
    return handleNotificationError(
      error,
      res
    );
  }
}


/* =========================================================
   MARCAR UNA COMO LEÍDA
   ========================================================= */

export async function markAsRead(
  req: Request,
  res: Response
) {
  try {
    const idUsuario =
      getAuthenticatedUserId(req);

    if (!idUsuario) {
      return res.status(401).json({
        status: "error",
        message:
          "Usuario no autenticado",
      });
    }

    const idNotificacion =
      Number(req.params.id);

    if (
      !Number.isInteger(
        idNotificacion
      ) ||
      idNotificacion <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "ID de notificación inválido",
      });
    }

    const notificacion =
      await markNotificationAsRead(
        idNotificacion,
        idUsuario
      );

    return res.status(200).json({
      status: "ok",
      message:
        "Notificación marcada como leída",
      notificacion,
    });
  } catch (error) {
    return handleNotificationError(
      error,
      res
    );
  }
}


/* =========================================================
   MARCAR TODAS COMO LEÍDAS
   ========================================================= */

export async function markAllAsRead(
  req: Request,
  res: Response
) {
  try {
    const idUsuario =
      getAuthenticatedUserId(req);

    if (!idUsuario) {
      return res.status(401).json({
        status: "error",
        message:
          "Usuario no autenticado",
      });
    }

    const resultado =
      await markAllNotificationsAsRead(
        idUsuario
      );

    return res.status(200).json({
      status: "ok",
      message:
        "Notificaciones marcadas como leídas",

      actualizadas:
        resultado.actualizadas,
    });
  } catch (error) {
    return handleNotificationError(
      error,
      res
    );
  }
}
