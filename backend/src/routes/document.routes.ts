import {
  Router,
} from "express";

import {
  upload,
  list,
  download,
  remove,
} from "../controllers/document.controller.js";

import {
  authenticateToken,
} from "../middlewares/auth.middleware.js";

import {
  authorizeRoles,
} from "../middlewares/role.middleware.js";

import {
  uploadSiaDocument,
} from "../config/upload.js";


const router =
  Router({
    mergeParams: true,
  });


router.use(
  authenticateToken
);


router.get(
  "/",
  list
);


router.get(
  "/:documentId/download",
  download
);


router.post(
  "/",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA",
    "FUNCIONARIO_OPERATIVO"
  ),

  uploadSiaDocument.single(
    "archivo"
  ),

  upload
);


router.delete(
  "/:documentId",

  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA"
  ),

  remove
);


export default router;
