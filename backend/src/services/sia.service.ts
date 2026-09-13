import { pool } from "../config/database.js";
import { addBusinessDays } from "../utils/businessDays.js";

interface CreateSiaRequestData {
  nombreSolicitante: string;
  emailSolicitante?: string | null;
  descripcion: string;
}

function generateFolio(): string {
  const now = new Date();

  const year = now.getFullYear();

  const timestamp = Date.now()
    .toString()
    .slice(-6);

  return `SIA-${year}-${timestamp}`;
}

export async function createSiaRequest(
  data: CreateSiaRequestData
) {
  const {
    nombreSolicitante,
    emailSolicitante,
    descripcion,
  } = data;

  const statusResult = await pool.query(
    `
    SELECT id_estado
    FROM estados_solicitud
    WHERE nombre = 'INGRESADA'
      AND activo = TRUE
    LIMIT 1
    `
  );

  if (statusResult.rowCount === 0) {
    throw new Error("ESTADO_INGRESADA_NO_CONFIGURADO");
  }

  const idEstado = statusResult.rows[0].id_estado;

  const fechaIngreso = new Date();

  const fechaVencimiento = addBusinessDays(
    fechaIngreso,
    20
  );

  const folio = generateFolio();

  const result = await pool.query(
    `
    INSERT INTO solicitudes_sia (
      folio,
      nombre_solicitante,
      email_solicitante,
      descripcion,
      fecha_ingreso,
      fecha_vencimiento,
      id_estado
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id_solicitud,
      folio,
      nombre_solicitante,
      email_solicitante,
      descripcion,
      fecha_ingreso,
      fecha_vencimiento,
      id_estado,
      tiene_prorroga,
      fecha_creacion
    `,
    [
      folio,
      nombreSolicitante,
      emailSolicitante ?? null,
      descripcion,
      fechaIngreso,
      fechaVencimiento,
      idEstado,
    ]
  );

  return result.rows[0];
}

export async function getSiaRequests() {
  const result = await pool.query(`
    SELECT
      s.id_solicitud,
      s.folio,
      s.nombre_solicitante,
      s.email_solicitante,
      s.descripcion,
      s.fecha_ingreso,
      s.fecha_vencimiento,
      s.fecha_cierre,
      s.tiene_prorroga,

      e.id_estado,
      e.nombre AS estado,

      d.id_departamento,
      d.nombre AS departamento,

      u.id_usuario AS id_responsable,
      CONCAT(u.nombre, ' ', u.apellido) AS responsable

    FROM solicitudes_sia s

    INNER JOIN estados_solicitud e
      ON e.id_estado = s.id_estado

    LEFT JOIN departamentos d
      ON d.id_departamento = s.id_departamento_responsable

    LEFT JOIN usuarios u
      ON u.id_usuario = s.id_responsable

    ORDER BY s.fecha_creacion DESC
  `);

  return result.rows;
}


export async function getSiaRequestById(idSolicitud: number) {
  const result = await pool.query(
    `
    SELECT
      s.id_solicitud,
      s.folio,
      s.nombre_solicitante,
      s.email_solicitante,
      s.descripcion,
      s.fecha_ingreso,
      s.fecha_vencimiento,
      s.fecha_cierre,
      s.tiene_prorroga,
      s.fecha_creacion,
      s.fecha_actualizacion,

      e.id_estado,
      e.nombre AS estado,

      d.id_departamento,
      d.nombre AS departamento,

      u.id_usuario AS id_responsable,
      u.nombre AS responsable_nombre,
      u.apellido AS responsable_apellido,
      u.email AS responsable_email

    FROM solicitudes_sia s

    INNER JOIN estados_solicitud e
      ON e.id_estado = s.id_estado

    LEFT JOIN departamentos d
      ON d.id_departamento = s.id_departamento_responsable

    LEFT JOIN usuarios u
      ON u.id_usuario = s.id_responsable

    WHERE s.id_solicitud = $1
    `,
    [idSolicitud]
  );

  if (result.rowCount === 0) {
    throw new Error("SOLICITUD_NO_ENCONTRADA");
  }

  return result.rows[0];
}


export async function assignSiaRequest(
  idSolicitud: number,
  idDepartamento: number,
  idResponsable: number
) {
  const requestResult = await pool.query(
    `
    SELECT id_solicitud
    FROM solicitudes_sia
    WHERE id_solicitud = $1
    `,
    [idSolicitud]
  );

  if (requestResult.rowCount === 0) {
    throw new Error("SOLICITUD_NO_ENCONTRADA");
  }

  const departmentResult = await pool.query(
    `
    SELECT id_departamento
    FROM departamentos
    WHERE id_departamento = $1
      AND activo = TRUE
    `,
    [idDepartamento]
  );

  if (departmentResult.rowCount === 0) {
    throw new Error("DEPARTAMENTO_INVALIDO");
  }

  /*
   * Comprobamos además que el funcionario exista, esté activo
   * y pertenezca al departamento seleccionado.
   */
  const userResult = await pool.query(
    `
    SELECT id_usuario
    FROM usuarios
    WHERE id_usuario = $1
      AND id_departamento = $2
      AND activo = TRUE
    `,
    [idResponsable, idDepartamento]
  );

  if (userResult.rowCount === 0) {
    throw new Error("RESPONSABLE_INVALIDO");
  }

  const statusResult = await pool.query(`
    SELECT id_estado
    FROM estados_solicitud
    WHERE nombre = 'ASIGNADA'
      AND activo = TRUE
    LIMIT 1
  `);

  if (statusResult.rowCount === 0) {
    throw new Error("ESTADO_ASIGNADA_NO_CONFIGURADO");
  }

  const result = await pool.query(
    `
    UPDATE solicitudes_sia
    SET
      id_departamento_responsable = $1,
      id_responsable = $2,
      id_estado = $3,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_solicitud = $4
    RETURNING *
    `,
    [
      idDepartamento,
      idResponsable,
      statusResult.rows[0].id_estado,
      idSolicitud,
    ]
  );

  return result.rows[0];
}


export async function changeSiaStatus(
  idSolicitud: number,
  idEstado: number
) {
  const requestResult = await pool.query(
    `
    SELECT id_solicitud
    FROM solicitudes_sia
    WHERE id_solicitud = $1
    `,
    [idSolicitud]
  );

  if (requestResult.rowCount === 0) {
    throw new Error("SOLICITUD_NO_ENCONTRADA");
  }

  const statusResult = await pool.query(
    `
    SELECT id_estado, nombre
    FROM estados_solicitud
    WHERE id_estado = $1
      AND activo = TRUE
    `,
    [idEstado]
  );

  if (statusResult.rowCount === 0) {
    throw new Error("ESTADO_INVALIDO");
  }

  const estado = statusResult.rows[0];

  const esFinalizada = estado.nombre === "FINALIZADA";

  const result = await pool.query(
    `
    UPDATE solicitudes_sia
    SET
      id_estado = $1,
      fecha_cierre =
        CASE
          WHEN $2::boolean = TRUE THEN CURRENT_DATE
          ELSE NULL
        END,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_solicitud = $3
    RETURNING *
    `,
    [
      idEstado,
      esFinalizada,
      idSolicitud,
    ]
  );

  return result.rows[0];
}