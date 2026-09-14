import type {
  Request,
  Response,
} from "express";

import fs from "fs/promises";

import {
  createTransparencyItem,
  getTransparencyItems,
  getTransparencyItemById,
  createTransparencyLoad,
  getTransparencyLoads,
  getTransparencyLoadById,
  attachTransparencyFile,
  validateTransparencyLoad,
  publishTransparencyLoad,
} from "../services/transparency.service.js";

import {
  registerAudit,
} from "../services/audit.service.js";

import {
  createNotification,
} from "../services/notification.service.js";

import {
  getAssignmentDepartments,
  getAssignmentUsers,
} from "../services/user.service.js";


/* =========================================================
   MANEJO GENERAL DE ERRORES
   ========================================================= */

function handleTransparencyError(
  error: unknown,
  res: Response
) {
  if (error instanceof Error) {
    switch (error.message) {
      case "DEPARTAMENTO_INVALIDO":
        return res.status(400).json({
          status: "error",
          message:
            "Departamento responsable inválido",
        });

      case "ITEM_NO_ENCONTRADO":
        return res.status(404).json({
          status: "error",
          message:
            "Ítem de Transparencia Activa no encontrado",
        });

      case "RESPONSABLE_INVALIDO":
        return res.status(400).json({
          status: "error",
          message:
            "El usuario responsable no existe o está inactivo",
        });

      case "RESPONSABLE_OTRO_DEPARTAMENTO":
        return res.status(400).json({
          status: "error",
          message:
            "El responsable debe pertenecer al departamento asignado al ítem",
        });

      case "CARGA_PERIODO_DUPLICADA":
        return res.status(409).json({
          status: "error",
          message:
            "Ya existe una carga para este ítem y período",
        });

      case "CARGA_NO_ENCONTRADA":
        return res.status(404).json({
          status: "error",
          message:
            "Carga de Transparencia Activa no encontrada",
        });

      case "CARGA_YA_PUBLICADA":
        return res.status(409).json({
          status: "error",
          message:
            "La carga ya fue publicada y no puede modificarse",
        });

      case "CARGA_NO_ESTA_EN_REVISION":
        return res.status(409).json({
          status: "error",
          message:
            "La carga debe estar EN_REVISION antes de ser validada",
        });

      case "OBSERVACION_REQUERIDA":
        return res.status(400).json({
          status: "error",
          message:
            "Debe indicar una observación al rechazar la carga",
        });

      case "CARGA_NO_APROBADA":
        return res.status(409).json({
          status: "error",
          message:
            "Solo una carga APROBADA puede ser publicada",
        });

      case "TIPO_ARCHIVO_NO_PERMITIDO":
        return res.status(400).json({
          status: "error",
          message:
            "Tipo de archivo no permitido",
        });

      case "USUARIO_NOTIFICACION_INVALIDO":
        return res.status(400).json({
          status: "error",
          message:
            "No fue posible generar la notificación para el usuario responsable",
        });
    }
  }

  console.error(
    "Error en Transparencia Activa:",
    error
  );

  return res.status(500).json({
    status: "error",
    message:
      "Error interno del servidor",
  });
}


/* =========================================================
   ÍTEMS
   ========================================================= */

export async function createItem(
  req: Request,
  res: Response
) {
  try {
    const {
      nombre,
      descripcion,
      idDepartamentoResponsable,
      periodicidad,
    } = req.body;

    if (
      typeof nombre !== "string" ||
      !nombre.trim()
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "El nombre del ítem es obligatorio",
      });
    }

    if (
      !Number.isInteger(
        idDepartamentoResponsable
      )
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Departamento responsable inválido",
      });
    }

    if (
      periodicidad !== undefined &&
      (
        typeof periodicidad !== "string" ||
        !periodicidad.trim()
      )
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Periodicidad inválida",
      });
    }

    const item =
      await createTransparencyItem({
        nombre:
          nombre.trim(),

        descripcion:
          typeof descripcion === "string"
            ? descripcion.trim() || null
            : null,

        idDepartamentoResponsable,

        periodicidad:
          periodicidad?.trim()
            .toUpperCase() ||
          "MENSUAL",
      });

    await registerAudit({
      idUsuario:
        req.user?.idUsuario,

      entidad:
        "ITEM_TRANSPARENCIA",

      idRegistro:
        item.id_item,

      accion:
        "CREAR_ITEM_TRANSPARENCIA",

      descripcion:
        `Se creó el ítem de Transparencia Activa: ${item.nombre}`,

      datosNuevos:
        item,

      ipOrigen:
        req.ip,
    });

    return res.status(201).json({
      status: "ok",
      message:
        "Ítem de Transparencia Activa creado correctamente",
      item,
    });
  } catch (error) {
    return handleTransparencyError(
      error,
      res
    );
  }
}


export async function listItems(
  _req: Request,
  res: Response
) {
  try {
    const items =
      await getTransparencyItems();

    return res.status(200).json({
      status: "ok",
      total:
        items.length,
      items,
    });
  } catch (error) {
    return handleTransparencyError(
      error,
      res
    );
  }
}


export async function getItem(
  req: Request,
  res: Response
) {
  try {
    const idItem =
      Number(req.params.id);

    if (
      !Number.isInteger(idItem) ||
      idItem <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "ID de ítem inválido",
      });
    }

    const item =
      await getTransparencyItemById(
        idItem
      );

    return res.status(200).json({
      status: "ok",
      item,
    });
  } catch (error) {
    return handleTransparencyError(
      error,
      res
    );
  }
}

export async function assignmentOptions(
  _req: Request,
  res: Response
) {
  try {
    const [
      departamentos,
      usuarios,
    ] = await Promise.all([
      getAssignmentDepartments(),
      getAssignmentUsers(),
    ]);

    return res.status(200).json({
      status: "ok",
      departamentos,
      usuarios,
    });
  } catch (error) {
    console.error(
      "Error obteniendo opciones de Transparencia Activa:",
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
   CARGAS MENSUALES
   ========================================================= */

export async function createLoad(
  req: Request,
  res: Response
) {
  try {
    const {
      idItem,
      idUsuarioResponsable,
      periodo,
    } = req.body;

    if (
      !Number.isInteger(idItem) ||
      idItem <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Ítem inválido",
      });
    }

    if (
      !Number.isInteger(
        idUsuarioResponsable
      ) ||
      idUsuarioResponsable <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Usuario responsable inválido",
      });
    }

    if (
      typeof periodo !== "string" ||
      !/^\d{4}-\d{2}-01$/.test(
        periodo
      )
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "El período debe utilizar el formato YYYY-MM-01",
      });
    }

    const carga =
      await createTransparencyLoad({
        idItem,
        idUsuarioResponsable,
        periodo,
      });

    await registerAudit({
      idUsuario:
        req.user?.idUsuario,

      entidad:
        "CARGA_TRANSPARENCIA",

      idRegistro:
        carga.id_carga,

      accion:
        "CREAR_CARGA_TRANSPARENCIA",

      descripcion:
        `Se creó una carga mensual de Transparencia Activa para el período ${periodo}`,

      datosNuevos:
        carga,

      ipOrigen:
        req.ip,
    });

    return res.status(201).json({
      status: "ok",
      message:
        "Carga mensual creada correctamente",
      carga,
    });
  } catch (error) {
    return handleTransparencyError(
      error,
      res
    );
  }
}


export async function listLoads(
  req: Request,
  res: Response
) {
  try {
    const periodo =
      typeof req.query.periodo ===
      "string"
        ? req.query.periodo
        : undefined;

    const cargas =
      await getTransparencyLoads(
        periodo
      );

    return res.status(200).json({
      status: "ok",
      total:
        cargas.length,
      cargas,
    });
  } catch (error) {
    return handleTransparencyError(
      error,
      res
    );
  }
}


export async function getLoad(
  req: Request,
  res: Response
) {
  try {
    const idCarga =
      Number(req.params.id);

    if (
      !Number.isInteger(idCarga) ||
      idCarga <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "ID de carga inválido",
      });
    }

    const carga =
      await getTransparencyLoadById(
        idCarga
      );

    return res.status(200).json({
      status: "ok",
      carga,
    });
  } catch (error) {
    return handleTransparencyError(
      error,
      res
    );
  }
}


/* =========================================================
   ARCHIVOS
   ========================================================= */

export async function uploadLoadFile(
  req: Request,
  res: Response
) {
  let uploadedFilePath:
    | string
    | undefined;

  try {
    const idCarga =
      Number(req.params.id);

    if (
      !Number.isInteger(idCarga) ||
      idCarga <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "ID de carga inválido",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message:
          "Debe seleccionar un archivo",
      });
    }

    uploadedFilePath =
      req.file.path;

    const cargaAnterior =
      await getTransparencyLoadById(
        idCarga
      );

    const carga =
      await attachTransparencyFile(
        idCarga,
        {
          nombreArchivo:
            req.file.originalname,

          rutaArchivo:
            req.file.path,
        }
      );

    await registerAudit({
      idUsuario:
        req.user?.idUsuario,

      entidad:
        "CARGA_TRANSPARENCIA",

      idRegistro:
        idCarga,

      accion:
        "CARGAR_ARCHIVO_TRANSPARENCIA",

      descripcion:
        `Se cargó el archivo ${req.file.originalname}`,

      datosAnteriores: {
        estado:
          cargaAnterior.estado,

        nombreArchivo:
          cargaAnterior.nombre_archivo,
      },

      datosNuevos: {
        estado:
          carga.estado,

        nombreArchivo:
          carga.nombre_archivo,
      },

      ipOrigen:
        req.ip,
    });

    return res.status(200).json({
      status: "ok",
      message:
        "Archivo cargado correctamente y enviado a revisión",
      carga,
    });
  } catch (error) {
    if (uploadedFilePath) {
      try {
        await fs.unlink(
          uploadedFilePath
        );
      } catch {
        // El archivo puede no existir.
      }
    }

    return handleTransparencyError(
      error,
      res
    );
  }
}


/* =========================================================
   VALIDACIÓN
   ========================================================= */

export async function validateLoad(
  req: Request,
  res: Response
) {
  try {
    const idCarga =
      Number(req.params.id);

    const {
      decision,
      observacion,
    } = req.body;

    if (
      !Number.isInteger(idCarga) ||
      idCarga <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "ID de carga inválido",
      });
    }

    if (
      decision !== "APROBADO" &&
      decision !== "RECHAZADO"
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "La decisión debe ser APROBADO o RECHAZADO",
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

    const cargaAnterior =
      await getTransparencyLoadById(
        idCarga
      );

    const carga =
      await validateTransparencyLoad(
        idCarga,
        req.user.idUsuario,
        decision,
        typeof observacion === "string"
          ? observacion
          : null
      );

    /*
     * Notificación automática
     * al dueño de la información.
     */
    if (
      decision === "RECHAZADO"
    ) {
      await createNotification({
        idUsuario:
          carga.id_usuario_responsable,

        titulo:
          "Carga de Transparencia rechazada",

        mensaje:
          `La carga de Transparencia Activa correspondiente al período ${carga.periodo} fue rechazada.${
            carga.observacion
              ? ` Observación: ${carga.observacion}`
              : ""
          }`,

        tipo:
          "ADVERTENCIA",
      });
    }


    if (
      decision === "APROBADO"
    ) {
      await createNotification({
        idUsuario:
          carga.id_usuario_responsable,

        titulo:
          "Carga de Transparencia aprobada",

        mensaje:
          `La carga de Transparencia Activa correspondiente al período ${carga.periodo} fue aprobada correctamente.`,

        tipo:
          "INFORMATIVA",
      });
    }

    await registerAudit({
      idUsuario:
        req.user.idUsuario,

      entidad:
        "CARGA_TRANSPARENCIA",

      idRegistro:
        idCarga,

      accion:
        decision === "APROBADO"
          ? "APROBAR_CARGA_TRANSPARENCIA"
          : "RECHAZAR_CARGA_TRANSPARENCIA",

      descripcion:
        decision === "APROBADO"
          ? "La carga de Transparencia Activa fue aprobada"
          : "La carga de Transparencia Activa fue rechazada",

      datosAnteriores: {
        estado:
          cargaAnterior.estado,
      },

      datosNuevos: {
        estado:
          carga.estado,

        observacion:
          carga.observacion,

        idUsuarioValidador:
          carga.id_usuario_validador,
      },

      ipOrigen:
        req.ip,
    });

    return res.status(200).json({
      status: "ok",

      message:
        decision === "APROBADO"
          ? "Carga aprobada correctamente"
          : "Carga rechazada correctamente",

      carga,
    });
  } catch (error) {
    return handleTransparencyError(
      error,
      res
    );
  }
}


/* =========================================================
   PUBLICACIÓN
   ========================================================= */

export async function publishLoad(
  req: Request,
  res: Response
) {
  try {
    const idCarga =
      Number(req.params.id);

    if (
      !Number.isInteger(idCarga) ||
      idCarga <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "ID de carga inválido",
      });
    }

    const cargaAnterior =
      await getTransparencyLoadById(
        idCarga
      );

    const carga =
      await publishTransparencyLoad(
        idCarga
      );

    await registerAudit({
      idUsuario:
        req.user?.idUsuario,

      entidad:
        "CARGA_TRANSPARENCIA",

      idRegistro:
        idCarga,

      accion:
        "PUBLICAR_CARGA_TRANSPARENCIA",

      descripcion:
        "La carga de Transparencia Activa fue publicada",

      datosAnteriores: {
        estado:
          cargaAnterior.estado,
      },

      datosNuevos: {
        estado:
          carga.estado,

        fechaPublicacion:
          carga.fecha_publicacion,
      },

      ipOrigen:
        req.ip,
    });

    return res.status(200).json({
      status: "ok",
      message:
        "Carga publicada correctamente",
      carga,
    });
  } catch (error) {
    return handleTransparencyError(
      error,
      res
    );
  }
}
