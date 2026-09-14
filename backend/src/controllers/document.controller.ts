import type {
  Request,
  Response,
} from "express";

import path from "path";

import {
  createDocument,
  getDocumentsByRequest,
  getDocumentById,
  deleteDocument,
} from "../services/document.service.js";

import {
  registerAudit,
} from "../services/audit.service.js";


function validateIds(
  idSolicitud: number,
  idDocumento?: number
) {
  if (
    !Number.isInteger(idSolicitud) ||
    idSolicitud <= 0
  ) {
    throw new Error(
      "ID_SOLICITUD_INVALIDO"
    );
  }

  if (
    idDocumento !== undefined &&
    (
      !Number.isInteger(idDocumento) ||
      idDocumento <= 0
    )
  ) {
    throw new Error(
      "ID_DOCUMENTO_INVALIDO"
    );
  }
}


function handleError(
  error: unknown,
  res: Response
) {
  if (error instanceof Error) {
    if (
      error.message ===
      "ID_SOLICITUD_INVALIDO"
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "ID de solicitud inválido",
      });
    }

    if (
      error.message ===
      "ID_DOCUMENTO_INVALIDO"
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "ID de documento inválido",
      });
    }

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
      "DOCUMENTO_NO_ENCONTRADO"
    ) {
      return res.status(404).json({
        status: "error",
        message:
          "Documento no encontrado",
      });
    }
  }

  console.error(
    "Error en documentos SIA:",
    error
  );

  return res.status(500).json({
    status: "error",
    message:
      "Error interno del servidor",
  });
}


export async function upload(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    validateIds(
      idSolicitud
    );

    if (
      !req.user?.idUsuario
    ) {
      return res.status(401).json({
        status: "error",
        message:
          "Usuario no autenticado",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message:
          "Debe seleccionar un archivo",
      });
    }

    const documento =
      await createDocument({
        idSolicitud,

        idUsuario:
          req.user.idUsuario,

        nombreOriginal:
          req.file.originalname,

        nombreAlmacenado:
          req.file.filename,

        rutaArchivo:
          req.file.path,

        tipoMime:
          req.file.mimetype,

        tamanoBytes:
          req.file.size,
      });

    await registerAudit({
      idUsuario:
        req.user.idUsuario,

      entidad:
        "SOLICITUD_SIA",

      idRegistro:
        idSolicitud,

      accion:
        "SUBIR_DOCUMENTO",

      descripcion:
        `Se adjuntó el documento ${req.file.originalname}`,

      datosNuevos: {
        idDocumento:
          documento.id_documento,

        nombre:
          documento.nombre_original,

        tipo:
          documento.tipo_mime,

        tamano:
          documento.tamano_bytes,
      },

      ipOrigen:
        req.ip,
    });

    return res.status(201).json({
      status: "ok",
      message:
        "Documento adjuntado correctamente",
      documento,
    });
  } catch (error) {
    return handleError(
      error,
      res
    );
  }
}


export async function list(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    validateIds(
      idSolicitud
    );

    const documentos =
      await getDocumentsByRequest(
        idSolicitud
      );

    return res.status(200).json({
      status: "ok",
      total:
        documentos.length,
      documentos,
    });
  } catch (error) {
    return handleError(
      error,
      res
    );
  }
}


export async function download(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    const idDocumento =
      Number(
        req.params.documentId
      );

    validateIds(
      idSolicitud,
      idDocumento
    );

    const documento =
      await getDocumentById(
        idSolicitud,
        idDocumento
      );

    const ruta =
      path.resolve(
        documento.ruta_archivo
      );

    return res.download(
      ruta,
      documento.nombre_original
    );
  } catch (error) {
    return handleError(
      error,
      res
    );
  }
}


export async function remove(
  req: Request,
  res: Response
) {
  try {
    const idSolicitud =
      Number(req.params.id);

    const idDocumento =
      Number(
        req.params.documentId
      );

    validateIds(
      idSolicitud,
      idDocumento
    );

    if (
      !req.user?.idUsuario
    ) {
      return res.status(401).json({
        status: "error",
        message:
          "Usuario no autenticado",
      });
    }

    const documento =
      await getDocumentById(
        idSolicitud,
        idDocumento
      );

    await deleteDocument(
      idSolicitud,
      idDocumento
    );

    await registerAudit({
      idUsuario:
        req.user.idUsuario,

      entidad:
        "SOLICITUD_SIA",

      idRegistro:
        idSolicitud,

      accion:
        "ELIMINAR_DOCUMENTO",

      descripcion:
        `Se eliminó el documento ${documento.nombre_original}`,

      datosAnteriores: {
        idDocumento:
          documento.id_documento,

        nombre:
          documento.nombre_original,
      },

      ipOrigen:
        req.ip,
    });

    return res.status(200).json({
      status: "ok",
      message:
        "Documento eliminado correctamente",
    });
  } catch (error) {
    return handleError(
      error,
      res
    );
  }
}
