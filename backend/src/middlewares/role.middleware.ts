import type { NextFunction, Request, Response } from "express";

export function authorizeRoles(...allowedRoles: string[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Usuario no autenticado",
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        status: "error",
        message: "No tienes permisos para realizar esta acción",
      });
    }

    next();
  };
}
