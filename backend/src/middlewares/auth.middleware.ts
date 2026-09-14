import type {
  NextFunction,
  Request,
  Response,
} from "express";

import jwt from "jsonwebtoken";


interface AuthTokenPayload
  extends jwt.JwtPayload {
  idUsuario: number;
  email: string;
  rol: string;
}


export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        status: "error",
        message:
          "Token de autenticación requerido",
      });
    }

    const token =
      authHeader.substring(7);

    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        "JWT_SECRET no está configurado"
      );

      return res.status(500).json({
        status: "error",
        message:
          "Error de configuración del servidor",
      });
    }

    const decoded =
      jwt.verify(
        token,
        secret
      );

    /*
     * jwt.verify puede retornar
     * string o JwtPayload.
     */
    if (
      typeof decoded === "string"
    ) {
      return res.status(401).json({
        status: "error",
        message:
          "Token inválido",
      });
    }

    /*
     * Validamos que el payload
     * contenga los datos que usa
     * nuestra aplicación.
     */
    if (
      typeof decoded.idUsuario !==
        "number" ||
      typeof decoded.email !==
        "string" ||
      typeof decoded.rol !==
        "string"
    ) {
      return res.status(401).json({
        status: "error",
        message:
          "Token inválido",
      });
    }

    const userPayload:
      AuthTokenPayload = {
        ...decoded,

        idUsuario:
          decoded.idUsuario,

        email:
          decoded.email,

        rol:
          decoded.rol,
      };

    req.user =
      userPayload;

    next();
  } catch (error) {
    if (
      error instanceof jwt.TokenExpiredError
    ) {
      return res.status(401).json({
        status: "error",
        message:
          "Token expirado",
      });
    }

    if (
      error instanceof jwt.JsonWebTokenError
    ) {
      return res.status(401).json({
        status: "error",
        message:
          "Token inválido",
      });
    }

    console.error(
      "Error validando token:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Error interno del servidor",
    });
  }
}
