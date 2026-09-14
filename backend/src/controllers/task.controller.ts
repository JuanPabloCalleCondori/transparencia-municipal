import type {
  Request,
  Response,
} from "express";

import {
  createTask,
  getTasksByRequest,
  getTaskById,
  changeTaskStatus,
  assignTaskResponsible,
} from "../services/task.service.js";

import {
  registerAudit,
} from "../services/audit.service.js";

import {
  createNotification,
} from "../services/notification.service.js";


/*
 * =========================================================
 * CREAR TAREA MADRE
 * =========================================================
 */

export async function createMotherTask(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    const {
      idUsuarioAsignado,
      titulo,
      descripcion,
      fechaVencimiento,
    } = req.body;

    if (
      !Number.isInteger(
        idSolicitud
      ) ||
      idSolicitud <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "ID de solicitud inválido",
      });
    }

    if (
      typeof titulo !== "string" ||
      !titulo.trim()
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "El título de la tarea es obligatorio",
      });
    }

    if (
      idUsuarioAsignado !==
        undefined &&
      idUsuarioAsignado !== null &&
      !Number.isInteger(
        idUsuarioAsignado
      )
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Usuario asignado inválido",
      });
    }

    const tarea =
      await createTask({
        idSolicitud,

        idUsuarioAsignado:
          idUsuarioAsignado ??
          null,

        titulo:
          titulo.trim(),

        descripcion:
          typeof descripcion ===
          "string"
            ? descripcion.trim()
            : null,

        fechaVencimiento:
          fechaVencimiento ??
          null,

        idTareaPadre:
          null,
      });

    await registerAudit({
      idUsuario:
        req.user?.idUsuario,

      entidad:
        "TAREA",

      idRegistro:
        tarea.id_tarea,

      accion:
        "CREAR_TAREA_MADRE",

      descripcion:
        `Se creó la tarea madre "${tarea.titulo}"`,

      datosNuevos:
        tarea,

      ipOrigen:
        req.ip,
    });

    if (
      tarea.id_usuario_asignado
    ) {
      await createNotification({
        idUsuario:
          tarea.id_usuario_asignado,

        titulo:
          "Nueva tarea SIA asignada",

        mensaje:
          `Se te ha asignado la tarea "${tarea.titulo}" asociada a la solicitud SIA N.º ${idSolicitud}.`,

        tipo:
          "TAREA",
      });
    }

    return res.status(201).json({
      status: "ok",
      message:
        "Tarea madre creada correctamente",
      tarea,
    });
  } catch (error) {
    return handleTaskError(
      error,
      res,
      "Error creando tarea madre"
    );
  }
}


/*
 * =========================================================
 * CREAR SUBTAREA
 * =========================================================
 */

export async function createSubtask(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    const idTareaPadre =
      Number(
        req.params.taskId
      );

    const {
      idUsuarioAsignado,
      titulo,
      descripcion,
      fechaVencimiento,
    } = req.body;

    if (
      !Number.isInteger(
        idSolicitud
      ) ||
      idSolicitud <= 0 ||
      !Number.isInteger(
        idTareaPadre
      ) ||
      idTareaPadre <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Solicitud o tarea padre inválida",
      });
    }

    if (
      typeof titulo !== "string" ||
      !titulo.trim()
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "El título de la subtarea es obligatorio",
      });
    }

    if (
      idUsuarioAsignado !==
        undefined &&
      idUsuarioAsignado !== null &&
      !Number.isInteger(
        idUsuarioAsignado
      )
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Usuario asignado inválido",
      });
    }

    const tarea =
      await createTask({
        idSolicitud,

        idUsuarioAsignado:
          idUsuarioAsignado ??
          null,

        titulo:
          titulo.trim(),

        descripcion:
          typeof descripcion ===
          "string"
            ? descripcion.trim()
            : null,

        fechaVencimiento:
          fechaVencimiento ??
          null,

        idTareaPadre,
      });

    await registerAudit({
      idUsuario:
        req.user?.idUsuario,

      entidad:
        "TAREA",

      idRegistro:
        tarea.id_tarea,

      accion:
        "CREAR_SUBTAREA",

      descripcion:
        `Se creó la subtarea "${tarea.titulo}"`,

      datosNuevos:
        tarea,

      ipOrigen:
        req.ip,
    });

    if (
      tarea.id_usuario_asignado
    ) {
      await createNotification({
        idUsuario:
          tarea.id_usuario_asignado,

        titulo:
          "Nueva subtarea SIA asignada",

        mensaje:
          `Se te ha asignado la subtarea "${tarea.titulo}" asociada a la solicitud SIA N.º ${idSolicitud}.`,

        tipo:
          "TAREA",
      });
    }

    return res.status(201).json({
      status: "ok",
      message:
        "Subtarea creada correctamente",
      tarea,
    });
  } catch (error) {
    return handleTaskError(
      error,
      res,
      "Error creando subtarea"
    );
  }
}


/*
 * =========================================================
 * LISTAR
 * =========================================================
 */

export async function listTasks(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    if (
      !Number.isInteger(
        idSolicitud
      ) ||
      idSolicitud <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "ID de solicitud inválido",
      });
    }

    const tareas =
      await getTasksByRequest(
        idSolicitud
      );

    return res.status(200).json({
      status: "ok",
      total:
        tareas.length,
      tareas,
    });
  } catch (error) {
    return handleTaskError(
      error,
      res,
      "Error listando tareas"
    );
  }
}


/*
 * =========================================================
 * DETALLE
 * =========================================================
 */

export async function getTask(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    const idTarea =
      Number(
        req.params.taskId
      );

    if (
      !Number.isInteger(
        idSolicitud
      ) ||
      idSolicitud <= 0 ||
      !Number.isInteger(
        idTarea
      ) ||
      idTarea <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Solicitud o tarea inválida",
      });
    }

    const tarea =
      await getTaskById(
        idSolicitud,
        idTarea
      );

    return res.status(200).json({
      status: "ok",
      tarea,
    });
  } catch (error) {
    return handleTaskError(
      error,
      res,
      "Error obteniendo tarea"
    );
  }
}


export async function assignTask(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    const idTarea =
      Number(req.params.taskId);

    const {
      idUsuarioAsignado,
    } = req.body;


    /*
     * Validamos IDs.
     */
    if (
      !Number.isInteger(
        idSolicitud
      ) ||
      idSolicitud <= 0 ||
      !Number.isInteger(
        idTarea
      ) ||
      idTarea <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Solicitud o tarea inválida",
      });
    }


    if (
      !Number.isInteger(
        idUsuarioAsignado
      ) ||
      idUsuarioAsignado <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Usuario asignado inválido",
      });
    }


    /*
     * Guardamos los datos anteriores
     * para auditoría.
     */
    const tareaAnterior =
      await getTaskById(
        idSolicitud,
        idTarea
      );


    /*
     * Ejecutamos la asignación.
     */
    const tarea =
      await assignTaskResponsible(
        idSolicitud,
        idTarea,
        idUsuarioAsignado
      );


    /*
     * Registramos auditoría.
     */
    await registerAudit({
      idUsuario:
        req.user?.idUsuario,

      entidad:
        "TAREA",

      idRegistro:
        idTarea,

      accion:
        "ASIGNAR_RESPONSABLE_TAREA",

      descripcion:
        `Se asignó un responsable a la tarea "${tarea.titulo}"`,

      datosAnteriores: {
        idUsuarioAsignado:
          tareaAnterior
            .id_usuario_asignado,

        usuarioNombre:
          tareaAnterior
            .usuario_nombre,

        usuarioApellido:
          tareaAnterior
            .usuario_apellido,
      },

      datosNuevos: {
        idUsuarioAsignado:
          tarea.id_usuario_asignado,

        usuarioNombre:
          tarea.usuario_nombre,

        usuarioApellido:
          tarea.usuario_apellido,
      },

      ipOrigen:
        req.ip,
    });


    /*
     * Notificamos al nuevo
     * responsable.
     */
    await createNotification({
      idUsuario:
        idUsuarioAsignado,

      titulo:
        "Tarea SIA asignada",

      mensaje:
        `Se te ha asignado la tarea "${tarea.titulo}" asociada a la solicitud SIA N.º ${idSolicitud}.`,

      tipo:
        "TAREA",
    });


    return res.status(200).json({
      status: "ok",
      message:
        "Responsable de tarea actualizado correctamente",
      tarea,
    });

  } catch (error) {
    return handleTaskError(
      error,
      res,
      "Error asignando responsable a tarea"
    );
  }
}

/*
 * =========================================================
 * ACTUALIZAR ESTADO
 * =========================================================
 */

export async function updateTaskStatus(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    const idTarea =
      Number(
        req.params.taskId
      );

    const {
      estado,
    } = req.body;

    if (
      !Number.isInteger(
        idSolicitud
      ) ||
      idSolicitud <= 0 ||
      !Number.isInteger(
        idTarea
      ) ||
      idTarea <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Solicitud o tarea inválida",
      });
    }

    if (
      typeof estado !== "string" ||
      !estado.trim()
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "El estado es obligatorio",
      });
    }

    /*
     * Aunque la ruta ya utiliza
     * authenticateToken, mantenemos
     * esta validación para no depender
     * únicamente del middleware.
     */
    if (
      !req.user?.idUsuario ||
      !req.user.rol
    ) {
      return res.status(401).json({
        status: "error",
        message:
          "Usuario no autenticado",
      });
    }

    const tareaAnterior =
      await getTaskById(
        idSolicitud,
        idTarea
      );

    const tarea =
      await changeTaskStatus(
        idSolicitud,
        idTarea,
        estado
          .trim()
          .toUpperCase(),
        {
          idUsuario:
            req.user.idUsuario,

          rol:
            req.user.rol,
        }
      );

    await registerAudit({
      idUsuario:
        req.user.idUsuario,

      entidad:
        "TAREA",

      idRegistro:
        idTarea,

      accion:
        "CAMBIAR_ESTADO_TAREA",

      descripcion:
        `La tarea "${tareaAnterior.titulo}" cambió de ${tareaAnterior.estado} a ${tarea.estado}`,

      datosAnteriores: {
        estado:
          tareaAnterior.estado,
      },

      datosNuevos: {
        estado:
          tarea.estado,

        fechaCompletada:
          tarea.fecha_completada,
      },

      ipOrigen:
        req.ip,
    });

    return res.status(200).json({
      status: "ok",
      message:
        "Estado de tarea actualizado correctamente",
      tarea,
    });
  } catch (error) {
    return handleTaskError(
      error,
      res,
      "Error actualizando tarea"
    );
  }
}


/*
 * =========================================================
 * MANEJO DE ERRORES
 * =========================================================
 */

function handleTaskError(
  error: unknown,
  res: Response,
  context: string
) {
  if (
    error instanceof Error
  ) {
    switch (error.message) {
      case "SOLICITUD_NO_ENCONTRADA":
        return res.status(404).json({
          status: "error",
          message:
            "Solicitud SIA no encontrada",
        });

      case "SOLICITUD_CERRADA":
        return res.status(409).json({
          status: "error",
          message:
            "No se pueden modificar tareas de una solicitud finalizada o cancelada",
        });

      case "TAREA_NO_ENCONTRADA":
        return res.status(404).json({
          status: "error",
          message:
            "Tarea no encontrada",
        });

      case "TAREA_PADRE_NO_ENCONTRADA":
        return res.status(404).json({
          status: "error",
          message:
            "Tarea padre no encontrada",
        });

      case "TAREA_PADRE_OTRA_SOLICITUD":
        return res.status(400).json({
          status: "error",
          message:
            "La tarea padre no pertenece a esta solicitud",
        });

      case "SUBTAREA_NO_PUEDE_SER_PADRE":
        return res.status(400).json({
          status: "error",
          message:
            "Una subtarea no puede contener nuevas subtareas",
        });

      case "TAREA_PADRE_CERRADA":
        return res.status(409).json({
          status: "error",
          message:
            "No se pueden agregar subtareas a una tarea madre completada o cancelada",
        });

      case "TAREA_MADRE_YA_EXISTENTE":
        return res.status(409).json({
          status: "error",
          message:
            "La solicitud ya posee una tarea madre",
        });

      case "SOLICITUD_CERRADA":
        return res.status(409).json({
          status: "error",
          message:
            "No es posible asignar tareas de una solicitud finalizada o cancelada",
        });
      
      case "USUARIO_INVALIDO":
        return res.status(400).json({
          status: "error",
          message:
            "El usuario asignado no existe o está inactivo",
        });

      case "ESTADO_TAREA_INVALIDO":
        return res.status(400).json({
          status: "error",
          message:
            "Estado de tarea inválido",
        });

      case "TRANSICION_TAREA_INVALIDA":
        return res.status(409).json({
          status: "error",
          message:
            "El cambio de estado solicitado no está permitido para esta tarea",
        });

      case "TAREA_CERRADA":
        return res.status(409).json({
          status: "error",
          message:
            "Una tarea completada o cancelada no puede volver a modificarse",
        });

      case "TAREA_NO_ASIGNADA_AL_USUARIO":
        return res.status(403).json({
          status: "error",
          message:
            "No tienes permisos para modificar una tarea asignada a otro usuario",
        });

      case "USUARIO_NOTIFICACION_INVALIDO":
        return res.status(400).json({
          status: "error",
          message:
            "No fue posible generar la notificación porque el usuario asignado es inválido",
        });
    }
  }

  console.error(
    `${context}:`,
    error
  );

  return res.status(500).json({
    status: "error",
    message:
      "Error interno del servidor",
  });
}
