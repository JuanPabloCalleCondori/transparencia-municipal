import { pool } from "../config/database.js";

export async function getDashboardSummary() {
  /*
   * =========================================================
   * RESUMEN GENERAL SIA
   * =========================================================
   */

  const siaResult = await pool.query(`
    SELECT
      COUNT(*)::int AS total_solicitudes,

      COUNT(*) FILTER (
        WHERE es.nombre NOT IN (
          'FINALIZADA',
          'CANCELADA'
        )
      )::int AS solicitudes_pendientes,

      COUNT(*) FILTER (
        WHERE es.nombre = 'FINALIZADA'
      )::int AS solicitudes_finalizadas,

      COUNT(*) FILTER (
        WHERE
          s.fecha_vencimiento < CURRENT_DATE
          AND es.nombre NOT IN (
            'FINALIZADA',
            'CANCELADA'
          )
      )::int AS solicitudes_vencidas

    FROM solicitudes_sia s

    INNER JOIN estados_solicitud es
      ON es.id_estado = s.id_estado
  `);

  /*
   * =========================================================
   * TASA DE CUMPLIMIENTO
   *
   * Consideramos únicamente solicitudes finalizadas.
   * Una solicitud cumple si fue cerrada antes o durante
   * su fecha de vencimiento.
   * =========================================================
   */

  const complianceResult =
    await pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE
            es.nombre = 'FINALIZADA'
        )::int AS total_finalizadas,

        COUNT(*) FILTER (
          WHERE
            es.nombre = 'FINALIZADA'
            AND s.fecha_cierre IS NOT NULL
            AND s.fecha_cierre <=
                s.fecha_vencimiento
        )::int AS finalizadas_en_plazo

      FROM solicitudes_sia s

      INNER JOIN estados_solicitud es
        ON es.id_estado = s.id_estado
    `);

  const totalFinalizadas =
    Number(
      complianceResult.rows[0]
        .total_finalizadas
    );

  const finalizadasEnPlazo =
    Number(
      complianceResult.rows[0]
        .finalizadas_en_plazo
    );

  const tasaCumplimiento =
    totalFinalizadas > 0
      ? Number(
          (
            (
              finalizadasEnPlazo /
              totalFinalizadas
            ) *
            100
          ).toFixed(2)
        )
      : 0;

  /*
   * =========================================================
   * TIEMPO PROMEDIO DE RESPUESTA
   *
   * Se calcula sobre solicitudes finalizadas.
   * PostgreSQL devuelve la diferencia entre DATE como días.
   * =========================================================
   */

  const averageResult =
    await pool.query(`
      SELECT
        ROUND(
          AVG(
            s.fecha_cierre -
            s.fecha_ingreso
          )::numeric,
          2
        ) AS promedio_dias

      FROM solicitudes_sia s

      INNER JOIN estados_solicitud es
        ON es.id_estado = s.id_estado

      WHERE
        es.nombre = 'FINALIZADA'
        AND s.fecha_cierre IS NOT NULL
    `);

  const tiempoPromedioRespuesta =
    averageResult.rows[0]
      .promedio_dias !== null
      ? Number(
          averageResult.rows[0]
            .promedio_dias
        )
      : 0;

  /*
   * =========================================================
   * SOLICITUDES POR ESTADO
   * =========================================================
   */

  const statesResult =
    await pool.query(`
      SELECT
        es.nombre AS estado,
        COUNT(s.id_solicitud)::int
          AS total

      FROM estados_solicitud es

      LEFT JOIN solicitudes_sia s
        ON s.id_estado =
           es.id_estado

      WHERE es.activo = TRUE

      GROUP BY
        es.id_estado,
        es.nombre

      ORDER BY
        es.id_estado
    `);

  /*
   * =========================================================
   * SOLICITUDES POR DEPARTAMENTO
   * =========================================================
   */

  const departmentsResult =
    await pool.query(`
      SELECT
        d.id_departamento,
        d.nombre AS departamento,
        COUNT(s.id_solicitud)::int
          AS total

      FROM departamentos d

      LEFT JOIN solicitudes_sia s
        ON s.id_departamento_responsable =
           d.id_departamento

      WHERE d.activo = TRUE

      GROUP BY
        d.id_departamento,
        d.nombre

      ORDER BY
        total DESC,
        d.nombre ASC
    `);

  /*
   * =========================================================
   * TRANSPARENCIA ACTIVA
   * =========================================================
   */

  const transparencyResult =
    await pool.query(`
      SELECT
        COUNT(*)::int
          AS total_cargas,

        COUNT(*) FILTER (
          WHERE estado = 'PENDIENTE'
        )::int AS pendientes,

        COUNT(*) FILTER (
          WHERE estado = 'CARGADO'
        )::int AS cargadas,

        COUNT(*) FILTER (
          WHERE estado = 'EN_REVISION'
        )::int AS en_revision,

        COUNT(*) FILTER (
          WHERE estado = 'APROBADO'
        )::int AS aprobadas,

        COUNT(*) FILTER (
          WHERE estado = 'RECHAZADO'
        )::int AS rechazadas,

        COUNT(*) FILTER (
          WHERE estado = 'PUBLICADO'
        )::int AS publicadas

      FROM cargas_transparencia
    `);

  /*
   * =========================================================
   * TRANSPARENCIA POR ESTADO
   * =========================================================
   */

  const transparencyStatesResult =
    await pool.query(`
      SELECT
        estado,
        COUNT(*)::int AS total

      FROM cargas_transparencia

      GROUP BY estado

      ORDER BY estado
    `);

  const sia =
    siaResult.rows[0];

  const transparencia =
    transparencyResult.rows[0];

  return {
    sia: {
      totalSolicitudes:
        Number(
          sia.total_solicitudes
        ),

      solicitudesPendientes:
        Number(
          sia.solicitudes_pendientes
        ),

      solicitudesVencidas:
        Number(
          sia.solicitudes_vencidas
        ),

      solicitudesFinalizadas:
        Number(
          sia.solicitudes_finalizadas
        ),

      tasaCumplimiento,

      tiempoPromedioRespuesta,
    },

    transparencia: {
      totalCargas:
        Number(
          transparencia.total_cargas
        ),

      pendientes:
        Number(
          transparencia.pendientes
        ),

      cargadas:
        Number(
          transparencia.cargadas
        ),

      enRevision:
        Number(
          transparencia.en_revision
        ),

      aprobadas:
        Number(
          transparencia.aprobadas
        ),

      rechazadas:
        Number(
          transparencia.rechazadas
        ),

      publicadas:
        Number(
          transparencia.publicadas
        ),
    },

    solicitudesPorEstado:
      statesResult.rows,

    solicitudesPorDepartamento:
      departmentsResult.rows,

    transparenciaPorEstado:
      transparencyStatesResult.rows,
  };
}