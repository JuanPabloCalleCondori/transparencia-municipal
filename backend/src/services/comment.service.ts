import { pool } from "../config/database.js";

export async function createComment(
  idSolicitud: number,
  idUsuario: number,
  contenido: string
) {
  const solicitudResult = await pool.query(
    `
    SELECT id_solicitud
    FROM solicitudes_sia
    WHERE id_solicitud = $1
    `,
    [idSolicitud]
  );

  if (solicitudResult.rowCount === 0) {
    throw new Error("SOLICITUD_NO_ENCONTRADA");
  }

  const result = await pool.query(
    `
    INSERT INTO comentarios (
      id_solicitud,
      id_usuario,
      contenido,
      fecha_creacion
    )
    VALUES (
      $1,
      $2,
      $3,
      CURRENT_TIMESTAMP
    )
    RETURNING
      id_comentario,
      id_solicitud,
      id_usuario,
      contenido,
      fecha_creacion
    `,
    [
      idSolicitud,
      idUsuario,
      contenido,
    ]
  );

  return result.rows[0];
}


export async function getCommentsByRequest(
  idSolicitud: number
) {
  const solicitudResult = await pool.query(
    `
    SELECT id_solicitud
    FROM solicitudes_sia
    WHERE id_solicitud = $1
    `,
    [idSolicitud]
  );

  if (solicitudResult.rowCount === 0) {
    throw new Error("SOLICITUD_NO_ENCONTRADA");
  }

  const result = await pool.query(
    `
    SELECT
      c.id_comentario,
      c.id_solicitud,
      c.id_usuario,
      c.contenido,
      c.fecha_creacion,

      u.nombre,
      u.apellido,
      u.email,

      r.nombre AS rol,

      d.nombre AS departamento

    FROM comentarios c

    INNER JOIN usuarios u
      ON u.id_usuario = c.id_usuario

    INNER JOIN roles r
      ON r.id_rol = u.id_rol

    LEFT JOIN departamentos d
      ON d.id_departamento = u.id_departamento

    WHERE c.id_solicitud = $1

    ORDER BY
      c.fecha_creacion ASC,
      c.id_comentario ASC
    `,
    [idSolicitud]
  );

  return result.rows;
}