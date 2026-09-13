import type { Request, Response } from "express";

import {
  createSiaRequest,
  getSiaRequests,
  getSiaRequestById,
  assignSiaRequest,
  changeSiaStatus,
} from "../services/sia.service.js";

import {
  registerAudit,
  getAuditByRecord,
} from "../services/audit.service.js";


export async function create(req: Request, res: Response) {
  try {
    const {
      nombreSolicitante,
      emailSolicitante,
      descripcion,
    } = req.body;

    if (
      typeof nombreSolicitante !== "string" ||
      !nombreSolicitante.trim() ||
      typeof descripcion !== "string" ||
      !descripcion.trim()
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Nombre del solicitante y descripción son obligatorios",
      });
    }

    if (
      emailSolicitante !== undefined &&
      emailSolicitante !== null &&
      typeof emailSolicitante !== "string"
    ) {
      return res.status(400).json({
        status: "error",
        message: "Email del solicitante inválido",
      });
    }

    const solicitud = await createSiaRequest({
      nombreSolicitante: nombreSolicitante.trim(),
      emailSolicitante:
        emailSolicitante?.trim() || null,
      descripcion: descripcion.trim(),
    });

    await registerAudit({
      idUsuario: req.user?.idUsuario,
      entidad: "SOLICITUD_SIA",
      idRegistro: solicitud.id_solicitud,
      accion: "CREAR_SOLICITUD",
      descripcion: `Se creó la solicitud ${solicitud.folio}`,
      datosNuevos: solicitud,
      ipOrigen: req.ip,
    });

    return res.status(201).json({
      status: "ok",
      message: "Solicitud SIA registrada correctamente",
      solicitud,
    });
  } catch (error) {
    console.error(
      "Error registrando solicitud SIA:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
}


export async function list(
  _req: Request,
  res: Response
) {
  try {
    const solicitudes = await getSiaRequests();

    return res.status(200).json({
      status: "ok",
      total: solicitudes.length,
      solicitudes,
    });
  } catch (error) {
    console.error(
      "Error listando solicitudes SIA:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
}


export async function getById(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud = Number(req.params.id);

    if (
      !Number.isInteger(idSolicitud) ||
      idSolicitud <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "ID de solicitud inválido",
      });
    }

    const solicitud =
      await getSiaRequestById(idSolicitud);

    return res.status(200).json({
      status: "ok",
      solicitud,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "SOLICITUD_NO_ENCONTRADA"
    ) {
      return res.status(404).json({
        status: "error",
        message: "Solicitud SIA no encontrada",
      });
    }

    console.error(
      "Error obteniendo solicitud SIA:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
}


export async function assign(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud = Number(req.params.id);

    const {
      idDepartamento,
      idResponsable,
    } = req.body;

    if (
      !Number.isInteger(idSolicitud) ||
      idSolicitud <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "ID de solicitud inválido",
      });
    }

    if (
      !Number.isInteger(idDepartamento) ||
      !Number.isInteger(idResponsable)
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Departamento y responsable son obligatorios",
      });
    }

    /*
     * Guardamos el estado actual de la solicitud
     * antes de modificarla.
     */
    const solicitudAnterior =
      await getSiaRequestById(idSolicitud);

    const solicitud = await assignSiaRequest(
      idSolicitud,
      idDepartamento,
      idResponsable
    );

    /*
     * Registramos quién realizó la asignación,
     * además del estado anterior y nuevo.
     */
    await registerAudit({
      idUsuario: req.user?.idUsuario,
      entidad: "SOLICITUD_SIA",
      idRegistro: idSolicitud,
      accion: "ASIGNAR_SOLICITUD",
      descripcion:
        `Se asignó la solicitud ${solicitudAnterior.folio}`,
      datosAnteriores: solicitudAnterior,
      datosNuevos: solicitud,
      ipOrigen: req.ip,
    });

    return res.status(200).json({
      status: "ok",
      message: "Solicitud asignada correctamente",
      solicitud,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
        "SOLICITUD_NO_ENCONTRADA"
      ) {
        return res.status(404).json({
          status: "error",
          message: "Solicitud SIA no encontrada",
        });
      }

      if (
        error.message ===
        "DEPARTAMENTO_INVALIDO"
      ) {
        return res.status(400).json({
          status: "error",
          message: "Departamento inválido",
        });
      }

      if (
        error.message ===
        "RESPONSABLE_INVALIDO"
      ) {
        return res.status(400).json({
          status: "error",
          message:
            "El responsable no existe, está inactivo o no pertenece al departamento",
        });
      }

      if (
        error.message ===
        "ESTADO_ASIGNADA_NO_CONFIGURADO"
      ) {
        return res.status(500).json({
          status: "error",
          message:
            "El estado ASIGNADA no está configurado en el sistema",
        });
      }
    }

    console.error(
      "Error asignando solicitud SIA:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
}


export async function changeStatus(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud = Number(req.params.id);
    const { idEstado } = req.body;

    if (
      !Number.isInteger(idSolicitud) ||
      idSolicitud <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "ID de solicitud inválido",
      });
    }

    if (!Number.isInteger(idEstado)) {
      return res.status(400).json({
        status: "error",
        message: "Estado inválido",
      });
    }

    /*
     * Obtenemos la solicitud antes de modificarla
     * para guardar el estado anterior.
     */
    const solicitudAnterior =
      await getSiaRequestById(idSolicitud);

    const solicitud = await changeSiaStatus(
      idSolicitud,
      idEstado
    );

    await registerAudit({
      idUsuario: req.user?.idUsuario,
      entidad: "SOLICITUD_SIA",
      idRegistro: idSolicitud,
      accion: "CAMBIAR_ESTADO",
      descripcion:
        `La solicitud ${solicitudAnterior.folio} cambió de estado`,
      datosAnteriores: {
        idEstado:
          solicitudAnterior.id_estado,
        estado:
          solicitudAnterior.estado,
      },
      datosNuevos: {
        idEstado:
          solicitud.id_estado,
      },
      ipOrigen: req.ip,
    });

    return res.status(200).json({
      status: "ok",
      message:
        "Estado actualizado correctamente",
      solicitud,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
        "SOLICITUD_NO_ENCONTRADA"
      ) {
        return res.status(404).json({
          status: "error",
          message: "Solicitud SIA no encontrada",
        });
      }

      if (
        error.message ===
        "ESTADO_INVALIDO"
      ) {
        return res.status(400).json({
          status: "error",
          message:
            "Estado de solicitud inválido",
        });
      }
    }

    console.error(
      "Error actualizando estado SIA:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
}


export async function history(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud = Number(req.params.id);

    if (
      !Number.isInteger(idSolicitud) ||
      idSolicitud <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "ID de solicitud inválido",
      });
    }

    /*
     * Verificamos que la solicitud exista
     * antes de consultar su historial.
     */
    const solicitud =
      await getSiaRequestById(idSolicitud);

    const historial =
      await getAuditByRecord(
        "SOLICITUD_SIA",
        idSolicitud
      );

    return res.status(200).json({
      status: "ok",
      solicitud: {
        idSolicitud:
          solicitud.id_solicitud,
        folio:
          solicitud.folio,
      },
      total: historial.length,
      historial,
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
      "Error obteniendo historial SIA:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
}