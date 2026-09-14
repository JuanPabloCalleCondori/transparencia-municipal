import {
  Router,
} from "express";

import {
  create,
  list,
} from "../controllers/comment.controller.js";

import {
  authenticateToken,
} from "../middlewares/auth.middleware.js";

import {
  authorizeRoles,
} from "../middlewares/role.middleware.js";


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


router.post(
  "/",
  authorizeRoles(
    "ADMINISTRADOR_MUNICIPAL",
    "ENLACE_MUNICIPAL",
    "DIRECTOR_AREA",
    "FUNCIONARIO_OPERATIVO"
  ),
  create
);


export default router;