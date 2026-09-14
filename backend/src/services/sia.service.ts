import { pool } from "../config/database.js";
import { addBusinessDays } from "../utils/businessDays.js";


interface CreateSiaRequestData {
  nombreSolicitante: string;
  emailSolicitante?: string | null;
  descripcion: string;
}


/*
 * =========================================================
 * GENERAR FOLIO
 * =========================================================
 *
 * El correlativo se obtiene desde PostgreSQL para evitar
 * colisiones producidas por timestamps.
 *
 * Ejemplo:
 * SIA-2026-000001
 */

async function generateFolio(): Promise<string> {
  const result = await pool.query(`
    SELECT
      nextval('sia_folio_seq')::bigint
        AS correlativo
  `);

  const correlativo =
    Number(
      result.rows[0].correlativo
    );

  const year =
    new Date().getFullYear();

  return `SIA-${year}-${String(
    correlativo
  ).padStart(6, "0")}`;
}


/*
 * =========================================================
 * CREAR SOLICITUD
 * =========================================================
 */

export async function createSiaRequest(
  data: CreateSiaRequestData
) {
  const {
    nombreSolicitante,
    emailSolicitante,
    descripcion,
  } = data;

  const statusResult =
    await pool.query(`
      SELECT id_estado
      FROM estados_solicitud

      WHERE nombre = 'INGRESADA'
        AND activo = TRUE

      LIMIT 1
    `);

  if (statusResult.rowCount === 0) {
    throw new Error(
      "ESTADO_INGRESADA_NO_CONFIGURADO"
    );
  }

  const idEstado =
    statusResult.rows[0].id_estado;

  const fechaIngreso =
    new Date();

  const fechaVencimiento =
    addBusinessDays(
      fechaIngreso,
      20
    );

  const folio =
    await generateFolio();

  const result =
    await pool.query(
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
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7
      )

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


/*
 * =========================================================
 * LISTAR SOLICITUDES
 * =========================================================
 */

export async function getSiaRequests() {
  const result =
    await pool.query(`
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
        CONCAT(
          u.nombre,
          ' ',
          u.apellido
        ) AS responsable

      FROM solicitudes_sia s

      INNER JOIN estados_solicitud e
        ON e.id_estado =
           s.id_estado

      LEFT JOIN departamentos d
        ON d.id_departamento =
           s.id_departamento_responsable

      LEFT JOIN usuarios u
        ON u.id_usuario =
           s.id_responsable

      ORDER BY
        s.fecha_creacion DESC
    `);

  return result.rows;
}


/*
 * =========================================================
 * DETALLE
 * =========================================================
 */

export async function getSiaRequestById(
  idSolicitud: number
) {
  const result =
    await pool.query(
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

        u.id_usuario
          AS id_responsable,

        u.nombre
          AS responsable_nombre,

        u.apellido
          AS responsable_apellido,

        u.email
          AS responsable_email

      FROM solicitudes_sia s

      INNER JOIN estados_solicitud e
        ON e.id_estado =
           s.id_estado

      LEFT JOIN departamentos d
        ON d.id_departamento =
           s.id_departamento_responsable

      LEFT JOIN usuarios u
        ON u.id_usuario =
           s.id_responsable

      WHERE
        s.id_solicitud = $1
      `,
      [
        idSolicitud,
      ]
    );

  if (result.rowCount === 0) {
    throw new Error(
      "SOLICITUD_NO_ENCONTRADA"
    );
  }

  return result.rows[0];
}


/*
 * =========================================================
 * ASIGNAR SOLICITUD
 * =========================================================
 */

export async function assignSiaRequest(
  idSolicitud: number,
  idDepartamento: number,
  idResponsable: number
) {
  /*
   * Obtenemos el estado actual.
   */
  const requestResult =
    await pool.query(
      `
      SELECT
        s.id_solicitud,
        e.nombre AS estado

      FROM solicitudes_sia s

      INNER JOIN estados_solicitud e
        ON e.id_estado =
           s.id_estado

      WHERE
        s.id_solicitud = $1
      `,
      [
        idSolicitud,
      ]
    );

  if (requestResult.rowCount === 0) {
    throw new Error(
      "SOLICITUD_NO_ENCONTRADA"
    );
  }

  const estadoActual =
    requestResult.rows[0].estado;

  /*
   * Una solicitud cerrada no puede
   * volver a ser asignada.
   */
  if (
    estadoActual === "FINALIZADA" ||
    estadoActual === "CANCELADA"
  ) {
    throw new Error(
      "SOLICITUD_CERRADA"
    );
  }

  /*
   * Departamento válido.
   */
  const departmentResult =
    await pool.query(
      `
      SELECT id_departamento

      FROM departamentos

      WHERE id_departamento = $1
        AND activo = TRUE
      `,
      [
        idDepartamento,
      ]
    );

  if (
    departmentResult.rowCount === 0
  ) {
    throw new Error(
      "DEPARTAMENTO_INVALIDO"
    );
  }

  /*
   * Responsable existente, activo
   * y perteneciente al departamento.
   */
  const userResult =
    await pool.query(
      `
      SELECT id_usuario

      FROM usuarios

      WHERE id_usuario = $1
        AND id_departamento = $2
        AND activo = TRUE
      `,
      [
        idResponsable,
        idDepartamento,
      ]
    );

  if (userResult.rowCount === 0) {
    throw new Error(
      "RESPONSABLE_INVALIDO"
    );
  }

  /*
   * Si todavía está INGRESADA,
   * su primera asignación la cambia
   * automáticamente a ASIGNADA.
   *
   * Si ya estaba EN_PROCESO o
   * EN_REVISION, una reasignación
   * conserva el estado actual.
   */
  let idEstadoNuevo:
    number | null = null;

  if (
    estadoActual === "INGRESADA"
  ) {
    const statusResult =
      await pool.query(`
        SELECT id_estado

        FROM estados_solicitud

        WHERE nombre = 'ASIGNADA'
          AND activo = TRUE

        LIMIT 1
      `);

    if (
      statusResult.rowCount === 0
    ) {
      throw new Error(
        "ESTADO_ASIGNADA_NO_CONFIGURADO"
      );
    }

    idEstadoNuevo =
      statusResult.rows[0].id_estado;
  }

  const result =
    await pool.query(
      `
      UPDATE solicitudes_sia

      SET
        id_departamento_responsable = $1,
        id_responsable = $2,

        id_estado =
          COALESCE(
            $3::integer,
            id_estado
          ),

        fecha_actualizacion =
          CURRENT_TIMESTAMP

      WHERE
        id_solicitud = $4

      RETURNING *
      `,
      [
        idDepartamento,
        idResponsable,
        idEstadoNuevo,
        idSolicitud,
      ]
    );

  return result.rows[0];
}


/*
 * =========================================================
 * CAMBIAR ESTADO
 * =========================================================
 */

export async function changeSiaStatus(
  idSolicitud: number,
  idEstado: number
) {
  /*
   * Estado actual.
   */
  const requestResult =
    await pool.query(
      `
      SELECT
        s.id_solicitud,
        e.nombre AS estado

      FROM solicitudes_sia s

      INNER JOIN estados_solicitud e
        ON e.id_estado =
           s.id_estado

      WHERE
        s.id_solicitud = $1
      `,
      [
        idSolicitud,
      ]
    );

  if (
    requestResult.rowCount === 0
  ) {
    throw new Error(
      "SOLICITUD_NO_ENCONTRADA"
    );
  }

  const estadoActual =
    requestResult.rows[0].estado;

  /*
   * Estado destino.
   */
  const statusResult =
    await pool.query(
      `
      SELECT
        id_estado,
        nombre

      FROM estados_solicitud

      WHERE id_estado = $1
        AND activo = TRUE
      `,
      [
        idEstado,
      ]
    );

  if (
    statusResult.rowCount === 0
  ) {
    throw new Error(
      "ESTADO_INVALIDO"
    );
  }

  const estadoNuevo =
    statusResult.rows[0].nombre;

  /*
   * Estados terminales.
   */
  if (
    estadoActual === "FINALIZADA" ||
    estadoActual === "CANCELADA"
  ) {
    throw new Error(
      "SOLICITUD_CERRADA"
    );
  }

  /*
   * Las transiciones normales
   * permitidas son:
   *
   * INGRESADA
   *   -> CANCELADA
   *
   * ASIGNADA
   *   -> EN_PROCESO
   *   -> CANCELADA
   *
   * EN_PROCESO
   *   -> EN_REVISION
   *   -> CANCELADA
   *
   * EN_REVISION
   *   -> EN_PROCESO
   *   -> FINALIZADA
   *   -> CANCELADA
   *
   * La transición INGRESADA -> ASIGNADA
   * se realiza exclusivamente mediante
   * assignSiaRequest().
   */
  const transiciones:
    Record<string, string[]> = {
      INGRESADA: [
        "CANCELADA",
      ],

      ASIGNADA: [
        "EN_PROCESO",
        "CANCELADA",
      ],

      EN_PROCESO: [
        "EN_REVISION",
        "CANCELADA",
      ],

      EN_REVISION: [
        "EN_PROCESO",
        "FINALIZADA",
        "CANCELADA",
      ],
    };

  const permitidos =
    transiciones[estadoActual] ?? [];

  if (
    !permitidos.includes(
      estadoNuevo
    )
  ) {
    throw new Error(
      "TRANSICION_ESTADO_INVALIDA"
    );
  }

  const esFinalizada =
    estadoNuevo === "FINALIZADA";

  const esCancelada =
    estadoNuevo === "CANCELADA";

  const result =
    await pool.query(
      `
      UPDATE solicitudes_sia

      SET
        id_estado = $1,

        fecha_cierre =
          CASE
            WHEN
              $2::boolean = TRUE
              OR
              $3::boolean = TRUE

              THEN CURRENT_DATE

            ELSE fecha_cierre
          END,

        fecha_actualizacion =
          CURRENT_TIMESTAMP

      WHERE
        id_solicitud = $4

      RETURNING *
      `,
      [
        idEstado,
        esFinalizada,
        esCancelada,
        idSolicitud,
      ]
    );

  return result.rows[0];
}
