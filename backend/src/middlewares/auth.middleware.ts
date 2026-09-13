import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      status: "error",
      message: "Token de acceso requerido",
    });
  }

  const [type, token] = authorization.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({
      status: "error",
      message: "Formato de token inválido",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET no está configurado");

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (
      typeof decoded === "string" ||
      typeof decoded.idUsuario !== "number" ||
      typeof decoded.email !== "string" ||
      typeof decoded.rol !== "string"
    ) {
      return res.status(401).json({
        status: "error",
        message: "Token inválido",
      });
    }

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      status: "error",
      message: "Token inválido o expirado",
    });
  }
}
