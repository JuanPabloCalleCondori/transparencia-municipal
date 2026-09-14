import {
  Router,
} from "express";

import {
  listNotifications,
  listUnreadNotifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";

import {
  authenticateToken,
} from "../middlewares/auth.middleware.js";


const router =
  Router();


router.use(
  authenticateToken
);


/*
 * Todas las notificaciones
 * del usuario autenticado.
 */
router.get(
  "/",
  listNotifications
);


/*
 * Solo las pendientes de lectura.
 */
router.get(
  "/unread",
  listUnreadNotifications
);


/*
 * Contador para el ícono/campana
 * del frontend.
 */
router.get(
  "/unread/count",
  unreadCount
);


/*
 * Importante:
 * /read-all debe declararse antes
 * de /:id/read.
 */
router.patch(
  "/read-all",
  markAllAsRead
);


/*
 * Marcar una notificación.
 */
router.patch(
  "/:id/read",
  markAsRead
);


export default router;
