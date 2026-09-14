import {
  Router,
} from "express";

import {
  createItem,
  listItems,
  getItem,
  createLoad,
  listLoads,
  getLoad,
  uploadLoadFile,
  validateLoad,
  publishLoad,
} from "../controllers/transparency.controller.js";

import {
  authenticateToken,
} from "../middlewares/auth.middleware.js";

import {
  authorizeRoles,
} from "../middlewares/role.middleware.js";

import {
  uploadTransparencyFile,
} from "../config/transparencyUpload.js";


const router =
  Router();


/*
 * Todo Transparencia Activa
 * requiere autenticación.
 */
router.use(
  authenticateToken
);


/* =========================================================
   ÍTEMS
   ========================================================= */


/*
 * Listar ítems.
 */
router.get(
  "/items",
  listItems
);


/*
 * Obtener un ítem.
 */
router.get(
  "/items/:id",
  getItem
);


/*
 * Crear ítem.
 */
router.post(
  "/items",

  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL"
  ),

  createItem
);


/* =========================================================
   CARGAS
   ========================================================= */


/*
 * Listar cargas.
 *
 * También permite:
 *
 * /loads?periodo=2026-09-01
 */
router.get(
  "/loads",
  listLoads
);


/*
 * Ver detalle.
 */
router.get(
  "/loads/:id",
  getLoad
);


/*
 * Crear carga mensual.
 */
router.post(
  "/loads",

  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA"
  ),

  createLoad
);


/*
 * Subir archivo.
 */
router.post(
  "/loads/:id/file",

  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA",
    "FUNCIONARIO_OPERATIVO"
  ),

  uploadTransparencyFile.single(
    "archivo"
  ),

  uploadLoadFile
);


/*
 * Aprobar / rechazar.
 */
router.patch(
  "/loads/:id/validate",

  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA"
  ),

  validateLoad
);


/*
 * Publicar.
 */
router.patch(
  "/loads/:id/publish",

  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL"
  ),

  publishLoad
);


export default router;
