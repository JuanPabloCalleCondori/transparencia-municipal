import { pool } from "../config/database.js";

interface AuditData {
  idUsuario?: number | null;
  entidad: string;
  idRegistro?: number | null;
  accion: string;
  descripcion?: string | null;
  datosAnteriores?: unknown;
  datosNuevos?: unknown;
  ipOrigen?: string | null;
}

export async function registerAudit(
  data: AuditData
) {
  const {
    idUsuario = null,
    entidad,
    idRegistro = null,
    accion,
    descripcion = null,
    datosAnteriores = null,
    datosNuevos = null,
    ipOrigen = null,
  } = data;

  const result = await pool.query(
    `
    INSERT INTO auditoria (
      id_usuario,
      entidad,
      id_registro,
      accion,
      descripcion,
      datos_anteriores,
      datos_nuevos,
      ip_origen
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      idUsuario,
      entidad,
      idRegistro,
      accion,
      descripcion,
      datosAnteriores
        ? JSON.stringify(datosAnteriores)
        : null,
      datosNuevos
        ? JSON.stringify(datosNuevos)
        : null,
      ipOrigen,
    ]
  );

  return result.rows[0];
}


export async function getAuditByRecord(
  entidad: string,
  idRegistro: number
) {
  const result = await pool.query(
    `
    SELECT
      a.id_auditoria,
      a.entidad,
      a.id_registro,
      a.accion,
      a.descripcion,
      a.datos_anteriores,
      a.datos_nuevos,
      a.ip_origen,
      a.fecha_hora,

      u.id_usuario,
      u.nombre AS usuario_nombre,
      u.apellido AS usuario_apellido,
      u.email AS usuario_email

    FROM auditoria a

    LEFT JOIN usuarios u
      ON u.id_usuario = a.id_usuario

    WHERE a.entidad = $1
      AND a.id_registro = $2

    ORDER BY a.fecha_hora ASC
    `,
    [entidad, idRegistro]
  );

  return result.rows;
}