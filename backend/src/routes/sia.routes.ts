import { Router } from "express";

import {
  create,
  list,
  getById,
  assign,
  changeStatus,
  history,
  createExtension,
  assignmentOptions,
} from "../controllers/sia.controller.js";

import {
  authenticateToken,
} from "../middlewares/auth.middleware.js";

import {
  authorizeRoles,
} from "../middlewares/role.middleware.js";


const router =
  Router();


/*
 * Todas las rutas SIA
 * requieren autenticación.
 */
router.use(
  authenticateToken
);


/*
 * Listar solicitudes.
 */
router.get(
  "/",
  list
);

router.get(
  "/assignment-options",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL"
  ),
  assignmentOptions
);

/*
 * Historial de auditoría.
 *
 * Importante:
 * esta ruta debe ir antes de /:id
 * para evitar conflictos.
 */
router.get(
  "/:id/history",
  history
);

/*
 * Obtener solicitud
 * por ID.
 */

router.get(
  "/:id",
  getById
);


/*
 * Crear solicitud SIA.
 */
router.post(
  "/",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL"
  ),
  create
);


/*
 * Asignar departamento
 * y responsable.
 */
router.patch(
  "/:id/assign",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL"
  ),
  assign
);


/*
 * Cambiar estado.
 */
router.patch(
  "/:id/status",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA"
  ),
  changeStatus
);


/*
 * Aplicar prórroga
 * de 10 días hábiles.
 */
router.post(
  "/:id/extensions",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA"
  ),
  createExtension
);


export default router;
