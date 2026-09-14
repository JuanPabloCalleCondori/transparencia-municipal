import type { Request, Response } from "express";
import {
  createUser,
  getUsers,
  updateUser,
  deactivateUser,
  getUserFormOptions,
} from "../services/user.service.js";

export async function create(req: Request, res: Response) {
  try {
    const {
      nombre,
      apellido,
      email,
      password,
      idRol,
      idDepartamento,
    } = req.body;

    if (
      typeof nombre !== "string" ||
      typeof apellido !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !nombre.trim() ||
      !apellido.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        status: "error",
        message: "Los datos obligatorios están incompletos",
      });
    }

    if (!Number.isInteger(idRol)) {
      return res.status(400).json({
        status: "error",
        message: "El rol ingresado no es válido",
      });
    }

    if (
      idDepartamento !== undefined &&
      idDepartamento !== null &&
      !Number.isInteger(idDepartamento)
    ) {
      return res.status(400).json({
        status: "error",
        message: "El departamento ingresado no es válido",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "La contraseña debe tener al menos 8 caracteres",
      });
    }

    const usuario = await createUser({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim(),
      password,
      idRol,
      idDepartamento,
    });

    return res.status(201).json({
      status: "ok",
      message: "Usuario creado correctamente",
      usuario,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EMAIL_EXISTENTE") {
        return res.status(409).json({
          status: "error",
          message: "El correo electrónico ya está registrado",
        });
      }

      if (error.message === "ROL_INVALIDO") {
        return res.status(400).json({
          status: "error",
          message: "El rol seleccionado no existe o está inactivo",
        });
      }

      if (error.message === "DEPARTAMENTO_INVALIDO") {
        return res.status(400).json({
          status: "error",
          message: "El departamento seleccionado no existe o está inactivo",
        });
      }
    }

    console.error("Error creando usuario:", error);

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
}

export async function list(_req: Request, res: Response) {
  try {
    const usuarios = await getUsers();

    return res.status(200).json({
      status: "ok",
      total: usuarios.length,
      usuarios,
    });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const idUsuario = Number(req.params.id);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(400).json({
        status: "error",
        message: "ID de usuario inválido",
      });
    }

    const {
      nombre,
      apellido,
      email,
      idRol,
      idDepartamento,
    } = req.body;

    if (
      nombre === undefined &&
      apellido === undefined &&
      email === undefined &&
      idRol === undefined &&
      idDepartamento === undefined
    ) {
      return res.status(400).json({
        status: "error",
        message: "No se enviaron datos para actualizar",
      });
    }

    if (
      nombre !== undefined &&
      (typeof nombre !== "string" || !nombre.trim())
    ) {
      return res.status(400).json({
        status: "error",
        message: "Nombre inválido",
      });
    }

    if (
      apellido !== undefined &&
      (typeof apellido !== "string" || !apellido.trim())
    ) {
      return res.status(400).json({
        status: "error",
        message: "Apellido inválido",
      });
    }

    if (
      email !== undefined &&
      (typeof email !== "string" || !email.trim())
    ) {
      return res.status(400).json({
        status: "error",
        message: "Email inválido",
      });
    }

    if (
      idRol !== undefined &&
      !Number.isInteger(idRol)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Rol inválido",
      });
    }

    if (
      idDepartamento !== undefined &&
      idDepartamento !== null &&
      !Number.isInteger(idDepartamento)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Departamento inválido",
      });
    }

    const usuario = await updateUser(idUsuario, {
      nombre: nombre?.trim(),
      apellido: apellido?.trim(),
      email: email?.trim(),
      idRol,
      idDepartamento,
    });

    return res.status(200).json({
      status: "ok",
      message: "Usuario actualizado correctamente",
      usuario,
    });
  } catch (error) {
    if (error instanceof Error) {
      const errors: Record<string, [number, string]> = {
        USUARIO_NO_ENCONTRADO: [404, "Usuario no encontrado"],
        EMAIL_EXISTENTE: [409, "El correo electrónico ya está registrado"],
        ROL_INVALIDO: [400, "El rol seleccionado no existe o está inactivo"],
        DEPARTAMENTO_INVALIDO: [
          400,
          "El departamento seleccionado no existe o está inactivo",
        ],
      };

      const response = errors[error.message];

      if (response) {
        return res.status(response[0]).json({
          status: "error",
          message: response[1],
        });
      }
    }

    console.error("Error actualizando usuario:", error);

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
}

export async function deactivate(req: Request, res: Response) {
  try {
    const idUsuario = Number(req.params.id);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(400).json({
        status: "error",
        message: "ID de usuario inválido",
      });
    }

    /*
     * Impedimos que el administrador actualmente autenticado
     * se desactive a sí mismo.
     */
    if (req.user?.idUsuario === idUsuario) {
      return res.status(400).json({
        status: "error",
        message: "No puedes desactivar tu propio usuario",
      });
    }

    const usuario = await deactivateUser(idUsuario);

    return res.status(200).json({
      status: "ok",
      message: "Usuario desactivado correctamente",
      usuario,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "USUARIO_NO_ENCONTRADO") {
        return res.status(404).json({
          status: "error",
          message: "Usuario no encontrado",
        });
      }

      if (error.message === "USUARIO_YA_INACTIVO") {
        return res.status(409).json({
          status: "error",
          message: "El usuario ya se encuentra inactivo",
        });
      }
    }

    console.error("Error desactivando usuario:", error);

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
}

export async function options(
  _req: Request,
  res: Response
) {
  try {
    const data =
      await getUserFormOptions();

    return res.status(200).json({
      status: "ok",
      ...data,
    });
  } catch (error) {
    console.error(
      "Error obteniendo opciones de usuarios:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Error interno del servidor",
    });
  }
}
