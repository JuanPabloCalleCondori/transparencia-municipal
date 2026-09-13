import { Router } from "express";
import {
  create,
  list,
  update,
  deactivate,
} from "../controllers/user.controller.js";

import { authenticateToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles("ADMINISTRADOR_MUNICIPAL"));

router.get("/", list);
router.post("/", create);
router.patch("/:id", update);
router.patch("/:id/deactivate", deactivate);

export default router;
