import type { Request, Response } from "express";
import { loginUser } from "../services/auth.service.js";

export async function login(req: Request, res: Response) {
  
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        status: "error",
        message: "Email y contraseña son obligatorios",
      });
    }

    const resultado = await loginUser({
      email: email.trim(),
      password,
    });

    if (!resultado) {
      return res.status(401).json({
        status: "error",
        message: "Credenciales incorrectas",
      });
    }

    return res.status(200).json({
      status: "ok",
      message: "Inicio de sesión exitoso",
      ...resultado,
    });
  } catch (error) {
    console.error("Error durante el inicio de sesión:", error);

    if (
      error instanceof Error &&
      error.message === "USUARIO_INACTIVO"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Usuario inactivo",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
}

// GET /api/auth/me
export function me(req: Request, res: Response) {
  return res.status(200).json({
    status: "ok",
    usuario: req.user,
  });
}

export function adminTest(_req: Request, res: Response) {
  return res.status(200).json({
    status: "ok",
    message: "Acceso autorizado como administrador",
  });
}
