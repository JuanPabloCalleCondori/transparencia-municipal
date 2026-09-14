import type {
  Request,
  Response,
} from "express";

import {
  createComment,
  getCommentsByRequest,
} from "../services/comment.service.js";

import {
  registerAudit,
} from "../services/audit.service.js";


export async function create(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    const {
      contenido,
    } = req.body;

    if (
      !Number.isInteger(idSolicitud) ||
      idSolicitud <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "ID de solicitud inválido",
      });
    }

    if (
      typeof contenido !== "string" ||
      !contenido.trim()
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "El contenido del comentario es obligatorio",
      });
    }

    if (!req.user?.idUsuario) {
      return res.status(401).json({
        status: "error",
        message:
          "Usuario no autenticado",
      });
    }

    const comentario =
      await createComment(
        idSolicitud,
        req.user.idUsuario,
        contenido.trim()
      );

    await registerAudit({
      idUsuario:
        req.user.idUsuario,

      entidad:
        "SOLICITUD_SIA",

      idRegistro:
        idSolicitud,

      accion:
        "AGREGAR_COMENTARIO",

      descripcion:
        "Se agregó un comentario interno a la solicitud",

      datosNuevos: {
        idComentario:
          comentario.id_comentario,
      },

      ipOrigen:
        req.ip,
    });

    return res.status(201).json({
      status: "ok",
      message:
        "Comentario registrado correctamente",
      comentario,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "SOLICITUD_NO_ENCONTRADA"
    ) {
      return res.status(404).json({
        status: "error",
        message:
          "Solicitud SIA no encontrada",
      });
    }

    console.error(
      "Error creando comentario:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Error interno del servidor",
    });
  }
}


export async function list(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    if (
      !Number.isInteger(idSolicitud) ||
      idSolicitud <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "ID de solicitud inválido",
      });
    }

    const comentarios =
      await getCommentsByRequest(
        idSolicitud
      );

    return res.status(200).json({
      status: "ok",
      total:
        comentarios.length,
      comentarios,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "SOLICITUD_NO_ENCONTRADA"
    ) {
      return res.status(404).json({
        status: "error",
        message:
          "Solicitud SIA no encontrada",
      });
    }

    console.error(
      "Error listando comentarios:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Error interno del servidor",
    });
  }
}