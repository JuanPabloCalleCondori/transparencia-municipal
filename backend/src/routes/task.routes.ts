import { Router } from "express";

import {
  createMotherTask,
  createSubtask,
  listTasks,
  getTask,
  updateTaskStatus,
  assignTask,
} from "../controllers/task.controller.js";

import {
  authenticateToken,
} from "../middlewares/auth.middleware.js";

import {
  authorizeRoles,
} from "../middlewares/role.middleware.js";

const router = Router({
  mergeParams: true,
});

router.use(authenticateToken);

router.get(
  "/",
  listTasks
);

router.get(
  "/:taskId",
  getTask
);

router.post(
  "/",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA"
  ),
  createMotherTask
);

router.post(
  "/:taskId/subtasks",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA"
  ),
  createSubtask
);

router.patch(
  "/:taskId/status",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA",
    "FUNCIONARIO_OPERATIVO"
  ),
  updateTaskStatus
);

router.patch(
  "/:taskId/assign",
  assignTask
);

export default router;
