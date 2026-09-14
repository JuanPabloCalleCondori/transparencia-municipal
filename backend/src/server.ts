import "dotenv/config";

import app from "./app.js";

import {
  startNotificationJob,
} from "./jobs/notification.job.js";

import {
  runNotificationAutomation,
} from "./services/notificationAutomation.service.js";


const PORT =
  Number(
    process.env.PORT
  ) || 3000;


app.listen(
  PORT,
  () => {
    console.log(
      `Servidor ejecutándose en http://localhost:${PORT}`
    );

    startNotificationJob();

    if (
      process.env
        .RUN_AUTOMATIONS_ON_START ===
      "true"
    ) {
      runNotificationAutomation()
        .catch((error) => {
          console.error(
            "[AUTOMATIZACIÓN] Error en ejecución inicial:",
            error
          );
        });
    }
  }
);