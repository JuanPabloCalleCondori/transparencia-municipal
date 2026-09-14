import {
  pool,
} from "../config/database.js";

import {
  countBusinessDays,
  getTrafficLight,
} from "./deadline.service.js";

import {
  createNotificationOnceToday,
} from "./notification.service.js";


interface AutomationResult {
  siaNotifications: number;
  transparencyNotifications: number;
  errors: number;
}


/* =========================================================
   ALERTAS AUTOMÁTICAS SIA
   ========================================================= */

async function processSiaAlerts(): Promise<{
  notifications: number;
  errors: number;
}> {
  let notifications = 0;
  let errors = 0;

  /*
   * Buscamos solamente solicitudes
   * que todavía se encuentran abiertas
   * y poseen un responsable.
   */
  const result =
    await pool.query(
      `
      SELECT
        s.id_solicitud,
        s.folio,
        s.fecha_vencimiento,
        s.id_responsable,

        e.nombre AS estado

      FROM solicitudes_sia s

      INNER JOIN estados_solicitud e
        ON e.id_estado =
           s.id_estado

      INNER JOIN usuarios u
        ON u.id_usuario =
           s.id_responsable

      WHERE e.nombre NOT IN (
        'FINALIZADA',
        'CANCELADA'
      )

        AND s.id_responsable
            IS NOT NULL

        AND u.activo = TRUE
      `
    );

  const hoy =
    new Date();

  for (
    const solicitud
    of result.rows
  ) {
    try {
      const fechaVencimiento =
        new Date(
          solicitud.fecha_vencimiento
        );

      const diasRestantes =
        countBusinessDays(
          hoy,
          fechaVencimiento
        );

      const semaforo =
        getTrafficLight(
          diasRestantes
        );

      /*
       * No generamos alertas verdes.
       */
      if (
        semaforo === "VERDE" &&
        diasRestantes >= 0
      ) {
        continue;
      }

      let titulo: string;
      let mensaje: string;
      let tipo: string;

      if (
        diasRestantes < 0
      ) {
        titulo =
          "Solicitud SIA vencida";

        mensaje =
          `La solicitud ${solicitud.folio} se encuentra vencida por ${Math.abs(
            diasRestantes
          )} día(s) hábil(es).`;

        tipo =
          "CRITICA";
      } else if (
        semaforo === "ROJO"
      ) {
        titulo =
          "Alerta crítica de plazo SIA";

        mensaje =
          `La solicitud ${solicitud.folio} vence en ${diasRestantes} día(s) hábil(es).`;

        tipo =
          "CRITICA";
      } else {
        titulo =
          "Solicitud SIA próxima a vencer";

        mensaje =
          `La solicitud ${solicitud.folio} vence en ${diasRestantes} día(s) hábil(es).`;

        tipo =
          "ADVERTENCIA";
      }

      const notification =
        await createNotificationOnceToday({
          idUsuario:
            solicitud.id_responsable,

          titulo,
          mensaje,
          tipo,
        });

      if (notification) {
        notifications++;
      }
    } catch (error) {
      errors++;

      console.error(
        `Error procesando alerta SIA ${solicitud.folio}:`,
        error
      );
    }
  }

  return {
    notifications,
    errors,
  };
}


/* =========================================================
   RECORDATORIOS DE TRANSPARENCIA ACTIVA
   ========================================================= */

async function processTransparencyAlerts(): Promise<{
  notifications: number;
  errors: number;
}> {
  let notifications = 0;
  let errors = 0;

  const hoy =
    new Date();

  const diaDelMes =
    hoy.getDate();

  /*
   * Según la regla del sistema,
   * los recordatorios automáticos
   * se ejecutan entre los días
   * 1 y 5 del mes.
   */
  if (
    diaDelMes < 1 ||
    diaDelMes > 5
  ) {
    return {
      notifications,
      errors,
    };
  }

  /*
   * Representamos el período como
   * el primer día del mes actual.
   */
  const year =
    hoy.getFullYear();

  const month =
    String(
      hoy.getMonth() + 1
    ).padStart(2, "0");

  const periodo =
    `${year}-${month}-01`;

  /*
   * Obtenemos todos los ítems
   * mensuales activos junto con
   * la carga correspondiente
   * al período actual, si existe.
   */
  const result =
    await pool.query(
      `
      SELECT
        i.id_item,
        i.nombre,
        i.id_departamento_responsable,

        c.id_carga,
        c.estado,
        c.id_usuario_responsable

      FROM items_transparencia i

      LEFT JOIN cargas_transparencia c
        ON c.id_item =
           i.id_item

       AND c.periodo = $1::date

      WHERE i.activo = TRUE
        AND UPPER(i.periodicidad) =
            'MENSUAL'

      ORDER BY
        i.id_item
      `,
      [
        periodo,
      ]
    );

  for (
    const item
    of result.rows
  ) {
    try {
      /*
       * Si ya fue cargado, está
       * en revisión, aprobado o
       * publicado, no corresponde
       * recordar la carga inicial.
       */
      if (
        item.id_carga &&
        item.estado !==
          "PENDIENTE" &&
        item.estado !==
          "RECHAZADO"
      ) {
        continue;
      }

      /*
       * CASO 1:
       * La carga mensual ya existe.
       *
       * Podemos avisar directamente
       * al responsable registrado.
       */
      if (
        item.id_carga &&
        item.id_usuario_responsable
      ) {
        const titulo =
          item.estado ===
            "RECHAZADO"
            ? "Carga de Transparencia requiere corrección"
            : "Recordatorio de Transparencia Activa";

        const mensaje =
          item.estado ===
            "RECHAZADO"
            ? `El ítem "${item.nombre}" correspondiente al período ${periodo} requiere correcciones antes de continuar con su validación.`
            : `El ítem "${item.nombre}" correspondiente al período ${periodo} continúa pendiente de carga.`;

        const notification =
          await createNotificationOnceToday({
            idUsuario:
              item.id_usuario_responsable,

            titulo,
            mensaje,

            tipo:
              item.estado ===
                "RECHAZADO"
                ? "ADVERTENCIA"
                : "RECORDATORIO",
          });

        if (notification) {
          notifications++;
        }

        continue;
      }

      /*
       * CASO 2:
       * Todavía no existe una carga
       * para este ítem.
       *
       * Como todavía no hay un dueño
       * individual asociado a la carga,
       * notificamos a los usuarios
       * activos del departamento
       * responsable.
       */
      const usersResult =
        await pool.query(
          `
          SELECT
            id_usuario

          FROM usuarios

          WHERE
            id_departamento = $1
            AND activo = TRUE
          `,
          [
            item.id_departamento_responsable,
          ]
        );

      for (
        const usuario
        of usersResult.rows
      ) {
        try {
          const titulo =
            "Carga mensual de Transparencia pendiente";

          const mensaje =
            `El ítem "${item.nombre}" todavía no registra una carga para el período ${periodo}.`;

          const notification =
            await createNotificationOnceToday({
              idUsuario:
                usuario.id_usuario,

              titulo,
              mensaje,

              tipo:
                "RECORDATORIO",
            });

          if (notification) {
            notifications++;
          }
        } catch (error) {
          errors++;

          console.error(
            `Error notificando Transparencia al usuario ${usuario.id_usuario}:`,
            error
          );
        }
      }
    } catch (error) {
      errors++;

      console.error(
        `Error procesando ítem de Transparencia ${item.id_item}:`,
        error
      );
    }
  }

  return {
    notifications,
    errors,
  };
}


/* =========================================================
   EJECUTAR TODAS LAS AUTOMATIZACIONES
   ========================================================= */

export async function runNotificationAutomation(): Promise<AutomationResult> {
  console.log(
    "[AUTOMATIZACIÓN] Iniciando revisión..."
  );

  const sia =
    await processSiaAlerts();

  const transparency =
    await processTransparencyAlerts();

  const result: AutomationResult = {
    siaNotifications:
      sia.notifications,

    transparencyNotifications:
      transparency.notifications,

    errors:
      sia.errors +
      transparency.errors,
  };

  console.log(
    "[AUTOMATIZACIÓN] Revisión finalizada:",
    result
  );

  return result;
}
