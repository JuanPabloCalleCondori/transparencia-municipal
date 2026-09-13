import { Router } from "express";
import {
  login, me, adminTest,
} from "../controllers/auth.controller.js";

import { authenticateToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/login", login);

router.get(
  "/me",
  authenticateToken,
  me
);

router.get(
  "/admin-test",
  authenticateToken,
  authorizeRoles("ADMINISTRADOR_MUNICIPAL"),
  adminTest
);

export default router;
