import cron from "node-cron";

import {
  runNotificationAutomation,
} from "../services/notificationAutomation.service.js";


export function startNotificationJob() {
  /*
   * Ejecutar todos los días
   * a las 08:00.
   *
   * La zona horaria explícita evita
   * que un servidor configurado en UTC
   * ejecute el proceso a otra hora.
   */
  cron.schedule(
    "0 8 * * *",

    async () => {
      try {
        await runNotificationAutomation();
      } catch (error) {
        console.error(
          "[AUTOMATIZACIÓN] Error general:",
          error
        );
      }
    },

    {
      timezone:
        "America/Santiago",
    }
  );

  console.log(
    "[AUTOMATIZACIÓN] Scheduler de notificaciones iniciado"
  );
}