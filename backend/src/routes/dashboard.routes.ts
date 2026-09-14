import {
  Router,
} from "express";

import {
  summary,
} from "../controllers/dashboard.controller.js";

import {
  authenticateToken,
} from "../middlewares/auth.middleware.js";

import {
  authorizeRoles,
} from "../middlewares/role.middleware.js";


const router =
  Router();


router.use(
  authenticateToken
);


/*
 * Dashboard de gestión.
 *
 * Administrador Municipal:
 * acceso global.
 *
 * Enlace Municipal:
 * supervisión de Transparencia y SIA.
 *
 * Director de Área:
 * indicadores para supervisión.
 */
router.get(
  "/summary",

  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA"
  ),

  summary
);


export default router;
