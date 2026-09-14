import { pool } from "../config/database.js";
import { addBusinessDays } from "../utils/businessDays.js";

export interface DeadlineInfo {
  fechaIngreso: string;
  fechaVencimiento: string;
  diasHabilesRestantes: number;
  vencida: boolean;
  semaforo: "VERDE" | "AMARILLO" | "ROJO";
}

function normalizeDate(date: Date): Date {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

export function countBusinessDays(
  startDate: Date,
  endDate: Date
): number {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (start.getTime() === end.getTime()) {
    return 0;
  }

  const direction =
    end.getTime() > start.getTime()
      ? 1
      : -1;

  let current = new Date(start);

  let businessDays = 0;

  while (
    current.getTime() !== end.getTime()
  ) {
    current.setDate(
      current.getDate() + direction
    );

    const day = current.getDay();

    const isWeekend =
      day === 0 || day === 6;

    if (!isWeekend) {
      businessDays += direction;
    }
  }

  return businessDays;
}

export function getTrafficLight(
  diasRestantes: number
): "VERDE" | "AMARILLO" | "ROJO" {
  if (diasRestantes <= 5) {
    return "ROJO";
  }

  if (diasRestantes <= 10) {
    return "AMARILLO";
  }

  return "VERDE";
}

export function calculateDeadlineInfo(
  fechaIngreso: Date,
  fechaVencimiento: Date
): DeadlineInfo {
  const hoy = new Date();

  const diasHabilesRestantes =
    countBusinessDays(
      hoy,
      fechaVencimiento
    );

  const vencida =
    diasHabilesRestantes < 0;

  return {
    fechaIngreso:
      fechaIngreso.toISOString(),
    fechaVencimiento:
      fechaVencimiento.toISOString(),
    diasHabilesRestantes,
    vencida,
    semaforo:
      getTrafficLight(
        diasHabilesRestantes
      ),
  };
}

export async function extendDeadline(
  idSolicitud: number,
  idUsuario: number,
  motivo: string
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const solicitudResult =
      await client.query(
        `
        SELECT
          id_solicitud,
          folio,
          fecha_vencimiento,
          tiene_prorroga
        FROM solicitudes_sia
        WHERE id_solicitud = $1
        FOR UPDATE
        `,
        [idSolicitud]
      );

    if (
      solicitudResult.rowCount === 0
    ) {
      throw new Error(
        "SOLICITUD_NO_ENCONTRADA"
      );
    }

    const solicitud =
      solicitudResult.rows[0];

    if (solicitud.tiene_prorroga) {
      throw new Error(
        "PRORROGA_YA_EXISTENTE"
      );
    }

    const fechaActualVencimiento =
      new Date(
        solicitud.fecha_vencimiento
      );

    const nuevaFechaVencimiento =
      addBusinessDays(
        fechaActualVencimiento,
        10
      );

    const numeroResolucion =
      `RES-${new Date().getFullYear()}-${idSolicitud}-${Date.now()
        .toString()
        .slice(-5)}`;

    const prorrogationResult =
      await client.query(
        `
        INSERT INTO prorrogas (
          id_solicitud,
          id_usuario,
          motivo,
          dias_prorroga,
          aprobada,
          fecha_resolucion,
          numero_resolucion
        )
        VALUES (
          $1,
          $2,
          $3,
          10,
          TRUE,
          CURRENT_TIMESTAMP,
          $4
        )
        RETURNING *
        `,
        [
          idSolicitud,
          idUsuario,
          motivo,
          numeroResolucion,
        ]
      );

    await client.query(
      `
      UPDATE solicitudes_sia
      SET
        fecha_vencimiento = $1,
        tiene_prorroga = TRUE,
        fecha_actualizacion =
          CURRENT_TIMESTAMP
      WHERE id_solicitud = $2
      `,
      [
        nuevaFechaVencimiento,
        idSolicitud,
      ]
    );

    await client.query("COMMIT");

    return {
      solicitud: {
        idSolicitud:
          solicitud.id_solicitud,
        folio:
          solicitud.folio,
        fechaVencimientoAnterior:
          solicitud.fecha_vencimiento,
        nuevaFechaVencimiento,
      },

      prorroga:
        prorrogationResult.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}