import type {
  Request,
  Response,
} from "express";

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

import {
  calculateDeadlineInfo,
  extendDeadline,
} from "../services/deadline.service.js";

import {
  createNotification,
} from "../services/notification.service.js";


/* =========================================================
   CREAR SOLICITUD
   ========================================================= */

export async function create(
  req: Request,
  res: Response
) {
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
        message:
          "Email del solicitante inválido",
      });
    }

    const solicitud =
      await createSiaRequest({
        nombreSolicitante:
          nombreSolicitante.trim(),

        emailSolicitante:
          emailSolicitante?.trim() ||
          null,

        descripcion:
          descripcion.trim(),
      });

    await registerAudit({
      idUsuario:
        req.user?.idUsuario,

      entidad:
        "SOLICITUD_SIA",

      idRegistro:
        solicitud.id_solicitud,

      accion:
        "CREAR_SOLICITUD",

      descripcion:
        `Se creó la solicitud ${solicitud.folio}`,

      datosNuevos:
        solicitud,

      ipOrigen:
        req.ip,
    });

    return res.status(201).json({
      status: "ok",
      message:
        "Solicitud SIA registrada correctamente",
      solicitud,
    });
  } catch (error) {
    console.error(
      "Error registrando solicitud SIA:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Error interno del servidor",
    });
  }
}


/* =========================================================
   LISTAR SOLICITUDES
   ========================================================= */

export async function list(
  _req: Request,
  res: Response
) {
  try {
    const solicitudes =
      await getSiaRequests();

    return res.status(200).json({
      status: "ok",
      total:
        solicitudes.length,
      solicitudes,
    });
  } catch (error) {
    console.error(
      "Error listando solicitudes SIA:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Error interno del servidor",
    });
  }
}


/* =========================================================
   DETALLE DE SOLICITUD
   ========================================================= */

export async function getById(
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

    const solicitud =
      await getSiaRequestById(
        idSolicitud
      );

    const plazo =
      calculateDeadlineInfo(
        new Date(
          solicitud.fecha_ingreso
        ),
        new Date(
          solicitud.fecha_vencimiento
        )
      );

    return res.status(200).json({
      status: "ok",
      solicitud,
      plazo,
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
      "Error obteniendo solicitud SIA:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Error interno del servidor",
    });
  }
}


/* =========================================================
   ASIGNAR SOLICITUD
   ========================================================= */

export async function assign(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

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
        message:
          "ID de solicitud inválido",
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
     * Guardamos el estado previo
     * para auditoría.
     */
    const solicitudAnterior =
      await getSiaRequestById(
        idSolicitud
      );

    /*
     * Asignamos departamento
     * y responsable.
     */
    const solicitud =
      await assignSiaRequest(
        idSolicitud,
        idDepartamento,
        idResponsable
      );

    /*
     * Notificación automática
     * al responsable asignado.
     */
    await createNotification({
      idUsuario:
        idResponsable,

      titulo:
        "Nueva solicitud SIA asignada",

      mensaje:
        `Se te ha asignado la solicitud ${solicitudAnterior.folio} para su gestión.`,

      tipo:
        "ASIGNACION",
    });

    /*
     * Auditoría.
     */
    await registerAudit({
      idUsuario:
        req.user?.idUsuario,

      entidad:
        "SOLICITUD_SIA",

      idRegistro:
        idSolicitud,

      accion:
        "ASIGNAR_SOLICITUD",

      descripcion:
        `Se asignó la solicitud ${solicitudAnterior.folio}`,

      datosAnteriores:
        solicitudAnterior,

      datosNuevos:
        solicitud,

      ipOrigen:
        req.ip,
    });

    return res.status(200).json({
      status: "ok",
      message:
        "Solicitud asignada correctamente",
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
          message:
            "Solicitud SIA no encontrada",
        });
      }

      if (
        error.message ===
        "DEPARTAMENTO_INVALIDO"
      ) {
        return res.status(400).json({
          status: "error",
          message:
            "Departamento inválido",
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

      if (
        error.message ===
        "USUARIO_NOTIFICACION_INVALIDO"
      ) {
        return res.status(400).json({
          status: "error",
          message:
            "No fue posible generar la notificación para el responsable",
        });
      }
      if (
        error.message ===
        "SOLICITUD_CERRADA"
      ) {
        return res.status(409).json({
          status: "error",
          message:
              "Una solicitud finalizada o cancelada no puede volver a asignarse",
      });
    }

    }

    console.error(
      "Error asignando solicitud SIA:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Error interno del servidor",
    });
  }
}


/* =========================================================
   CAMBIAR ESTADO
   ========================================================= */

export async function changeStatus(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    const {
      idEstado,
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
      !Number.isInteger(idEstado)
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Estado inválido",
      });
    }

    const solicitudAnterior =
      await getSiaRequestById(
        idSolicitud
      );

    const solicitud =
      await changeSiaStatus(
        idSolicitud,
        idEstado
      );

    await registerAudit({
      idUsuario:
        req.user?.idUsuario,

      entidad:
        "SOLICITUD_SIA",

      idRegistro:
        idSolicitud,

      accion:
        "CAMBIAR_ESTADO",

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

      ipOrigen:
        req.ip,
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
          message:
            "Solicitud SIA no encontrada",
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
      if (
        error.message ===
        "SOLICITUD_CERRADA"
      ) {
        return res.status(409).json({
          status: "error",
          message:
            "La solicitud ya se encuentra cerrada y no puede cambiar de estado",
      });
      }

      if (
        error.message ===
        "TRANSICION_ESTADO_INVALIDA"
      ) {
        return res.status(409).json({
          status: "error",
          message:
            "La transición solicitada no está permitida para el estado actual",
      });
      }
    }

    console.error(
      "Error actualizando estado SIA:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Error interno del servidor",
    });
  }
}


/* =========================================================
   PRÓRROGA
   ========================================================= */

export async function createExtension(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    const {
      motivo,
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
      typeof motivo !== "string" ||
      !motivo.trim()
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "El motivo de la prórroga es obligatorio",
      });
    }

    if (
      !req.user?.idUsuario
    ) {
      return res.status(401).json({
        status: "error",
        message:
          "Usuario no autenticado",
      });
    }

    const solicitudAnterior =
      await getSiaRequestById(
        idSolicitud
      );

    const resultado =
      await extendDeadline(
        idSolicitud,
        req.user.idUsuario,
        motivo.trim()
      );

    const solicitudActualizada =
      await getSiaRequestById(
        idSolicitud
      );

    await registerAudit({
      idUsuario:
        req.user.idUsuario,

      entidad:
        "SOLICITUD_SIA",

      idRegistro:
        idSolicitud,

      accion:
        "APLICAR_PRORROGA",

      descripcion:
        `Se aplicó una prórroga de 10 días hábiles a la solicitud ${solicitudAnterior.folio}`,

      datosAnteriores: {
        fechaVencimiento:
          solicitudAnterior
            .fecha_vencimiento,

        tieneProrroga:
          solicitudAnterior
            .tiene_prorroga,
      },

      datosNuevos: {
        fechaVencimiento:
          solicitudActualizada
            .fecha_vencimiento,

        tieneProrroga:
          solicitudActualizada
            .tiene_prorroga,

        numeroResolucion:
          resultado
            .prorroga
            .numero_resolucion,
      },

      ipOrigen:
        req.ip,
    });

    const plazo =
      calculateDeadlineInfo(
        new Date(
          solicitudActualizada
            .fecha_ingreso
        ),
        new Date(
          solicitudActualizada
            .fecha_vencimiento
        )
      );

    return res.status(201).json({
      status: "ok",
      message:
        "Prórroga aplicada correctamente",

      solicitud:
        solicitudActualizada,

      prorroga:
        resultado.prorroga,

      plazo,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
        "SOLICITUD_NO_ENCONTRADA"
      ) {
        return res.status(404).json({
          status: "error",
          message:
            "Solicitud SIA no encontrada",
        });
      }

      if (
        error.message ===
        "PRORROGA_YA_EXISTENTE"
      ) {
        return res.status(409).json({
          status: "error",
          message:
            "La solicitud ya posee una prórroga",
        });
      }
    }

    console.error(
      "Error aplicando prórroga:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Error interno del servidor",
    });
  }
}


/* =========================================================
   HISTORIAL
   ========================================================= */

export async function history(
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

    const solicitud =
      await getSiaRequestById(
        idSolicitud
      );

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

      total:
        historial.length,

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
      message:
        "Error interno del servidor",
    });
  }
}
