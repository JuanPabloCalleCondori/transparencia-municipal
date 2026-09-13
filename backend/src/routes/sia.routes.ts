import { Router } from "express";

import {
  create,
  list,
  getById,
  assign,
  changeStatus,
  history,
} from "../controllers/sia.controller.js";

import {
  authenticateToken,
} from "../middlewares/auth.middleware.js";

import {
  authorizeRoles,
} from "../middlewares/role.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/", list);

router.get(
  "/:id/history",
  history
);

router.get(
  "/:id",
  getById
);

router.post(
  "/",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL"
  ),
  create
);

router.patch(
  "/:id/assign",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL"
  ),
  assign
);

router.patch(
  "/:id/status",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA"
  ),
  changeStatus
);

export default router;
