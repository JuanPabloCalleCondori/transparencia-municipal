import fs from "fs/promises";

import {
  pool,
} from "../config/database.js";


export interface CreateDocumentData {
  idSolicitud: number;
  idUsuario: number;
  nombreOriginal: string;
  nombreAlmacenado: string;
  rutaArchivo: string;
  tipoMime: string;
  tamanoBytes: number;
}


async function validateRequest(
  idSolicitud: number
) {
  const result =
    await pool.query(
      `
      SELECT id_solicitud
      FROM solicitudes_sia
      WHERE id_solicitud = $1
      `,
      [idSolicitud]
    );

  if (
    result.rowCount === 0
  ) {
    throw new Error(
      "SOLICITUD_NO_ENCONTRADA"
    );
  }
}


export async function createDocument(
  data: CreateDocumentData
) {
  await validateRequest(
    data.idSolicitud
  );

  const result =
    await pool.query(
      `
      INSERT INTO documentos (
        id_solicitud,
        id_usuario,

        nombre_archivo,
        ruta_archivo,

        nombre_original,
        nombre_almacenado,
        tipo_mime,
        tamano_bytes,

        fecha_creacion
      )
      VALUES (
        $1,
        $2,

        $3,
        $4,

        $5,
        $6,
        $7,
        $8,

        CURRENT_TIMESTAMP
      )
      RETURNING
        id_documento,
        id_solicitud,
        id_usuario,

        nombre_archivo,
        ruta_archivo,

        nombre_original,
        nombre_almacenado,
        tipo_mime,
        tamano_bytes,

        fecha_creacion
      `,
      [
        data.idSolicitud,
        data.idUsuario,

        data.nombreOriginal,
        data.rutaArchivo,

        data.nombreOriginal,
        data.nombreAlmacenado,
        data.tipoMime,
        data.tamanoBytes,
      ]
    );

  return result.rows[0];
}


export async function getDocumentsByRequest(
  idSolicitud: number
) {
  await validateRequest(
    idSolicitud
  );

  const result =
    await pool.query(
      `
      SELECT
        doc.id_documento,
        doc.id_solicitud,
        doc.id_usuario,

        doc.nombre_archivo,
        doc.nombre_original,
        doc.nombre_almacenado,

        doc.tipo_mime,
        doc.tamano_bytes,
        doc.fecha_creacion,

        u.nombre,
        u.apellido,
        u.email,

        r.nombre AS rol,

        dep.nombre AS departamento

      FROM documentos doc

      INNER JOIN usuarios u
        ON u.id_usuario =
           doc.id_usuario

      INNER JOIN roles r
        ON r.id_rol =
           u.id_rol

      LEFT JOIN departamentos dep
        ON dep.id_departamento =
           u.id_departamento

      WHERE doc.id_solicitud = $1

      ORDER BY
        doc.fecha_creacion DESC,
        doc.id_documento DESC
      `,
      [idSolicitud]
    );

  return result.rows;
}


export async function getDocumentById(
  idSolicitud: number,
  idDocumento: number
) {
  const result =
    await pool.query(
      `
      SELECT *
      FROM documentos
      WHERE id_documento = $1
        AND id_solicitud = $2
      `,
      [
        idDocumento,
        idSolicitud,
      ]
    );

  if (
    result.rowCount === 0
  ) {
    throw new Error(
      "DOCUMENTO_NO_ENCONTRADO"
    );
  }

  return result.rows[0];
}


export async function deleteDocument(
  idSolicitud: number,
  idDocumento: number
) {
  const documento =
    await getDocumentById(
      idSolicitud,
      idDocumento
    );

  const result =
    await pool.query(
      `
      DELETE FROM documentos
      WHERE id_documento = $1
        AND id_solicitud = $2
      RETURNING *
      `,
      [
        idDocumento,
        idSolicitud,
      ]
    );

  try {
    await fs.unlink(
      documento.ruta_archivo
    );
  } catch (error) {
    console.warn(
      "No se pudo eliminar el archivo físico:",
      error
    );
  }

  return result.rows[0];
}