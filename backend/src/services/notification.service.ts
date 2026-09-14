import {
  pool,
} from "../config/database.js";


export interface CreateNotificationData {
  idUsuario: number;
  titulo: string;
  mensaje: string;
  tipo?: string;
}


/* =========================================================
   CREAR NOTIFICACIÓN
   ========================================================= */

export async function createNotification(
  data: CreateNotificationData
) {
  /*
   * Validamos que el usuario exista
   * y esté activo.
   */
  const usuarioResult =
    await pool.query(
      `
      SELECT id_usuario
      FROM usuarios
      WHERE id_usuario = $1
        AND activo = TRUE
      `,
      [data.idUsuario]
    );

  if (
    usuarioResult.rowCount === 0
  ) {
    throw new Error(
      "USUARIO_NOTIFICACION_INVALIDO"
    );
  }

  const result =
    await pool.query(
      `
      INSERT INTO notificaciones (
        id_usuario,
        titulo,
        mensaje,
        tipo,
        leida
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        FALSE
      )
      RETURNING
        id_notificacion,
        id_usuario,
        titulo,
        mensaje,
        tipo,
        leida,
        fecha_creacion,
        fecha_lectura
      `,
      [
        data.idUsuario,
        data.titulo,
        data.mensaje,
        data.tipo ?? "INFORMATIVA",
      ]
    );

  return result.rows[0];
}


/* =========================================================
   LISTAR NOTIFICACIONES DE UN USUARIO
   ========================================================= */

export async function getNotificationsByUser(
  idUsuario: number,
  onlyUnread = false
) {
  const values: unknown[] = [
    idUsuario,
  ];

  let unreadCondition = "";

  if (onlyUnread) {
    unreadCondition =
      "AND n.leida = FALSE";
  }

  const result =
    await pool.query(
      `
      SELECT
        n.id_notificacion,
        n.id_usuario,
        n.titulo,
        n.mensaje,
        n.tipo,
        n.leida,
        n.fecha_creacion,
        n.fecha_lectura

      FROM notificaciones n

      WHERE n.id_usuario = $1

      ${unreadCondition}

      ORDER BY
        n.fecha_creacion DESC,
        n.id_notificacion DESC
      `,
      values
    );

  return result.rows;
}


/* =========================================================
   CONTAR NO LEÍDAS
   ========================================================= */

export async function countUnreadNotifications(
  idUsuario: number
) {
  const result =
    await pool.query(
      `
      SELECT
        COUNT(*)::INTEGER AS total

      FROM notificaciones

      WHERE id_usuario = $1
        AND leida = FALSE
      `,
      [idUsuario]
    );

  return result.rows[0].total;
}


/* =========================================================
   OBTENER NOTIFICACIÓN
   ========================================================= */

export async function getNotificationById(
  idNotificacion: number,
  idUsuario: number
) {
  const result =
    await pool.query(
      `
      SELECT
        id_notificacion,
        id_usuario,
        titulo,
        mensaje,
        tipo,
        leida,
        fecha_creacion,
        fecha_lectura

      FROM notificaciones

      WHERE id_notificacion = $1
        AND id_usuario = $2
      `,
      [
        idNotificacion,
        idUsuario,
      ]
    );

  if (
    result.rowCount === 0
  ) {
    throw new Error(
      "NOTIFICACION_NO_ENCONTRADA"
    );
  }

  return result.rows[0];
}


/* =========================================================
   MARCAR UNA COMO LEÍDA
   ========================================================= */

export async function markNotificationAsRead(
  idNotificacion: number,
  idUsuario: number
) {
  /*
   * Importante:
   * también filtramos por id_usuario.
   *
   * Así un usuario no puede marcar
   * notificaciones de otra persona.
   */
  const result =
    await pool.query(
      `
      UPDATE notificaciones

      SET
        leida = TRUE,

        fecha_lectura =
          CASE
            WHEN fecha_lectura IS NULL
              THEN CURRENT_TIMESTAMP
            ELSE fecha_lectura
          END

      WHERE id_notificacion = $1
        AND id_usuario = $2

      RETURNING
        id_notificacion,
        id_usuario,
        titulo,
        mensaje,
        tipo,
        leida,
        fecha_creacion,
        fecha_lectura
      `,
      [
        idNotificacion,
        idUsuario,
      ]
    );

  if (
    result.rowCount === 0
  ) {
    throw new Error(
      "NOTIFICACION_NO_ENCONTRADA"
    );
  }

  return result.rows[0];
}


/* =========================================================
   MARCAR TODAS COMO LEÍDAS
   ========================================================= */

export async function markAllNotificationsAsRead(
  idUsuario: number
) {
  const result =
    await pool.query(
      `
      UPDATE notificaciones

      SET
        leida = TRUE,

        fecha_lectura =
          CASE
            WHEN fecha_lectura IS NULL
              THEN CURRENT_TIMESTAMP
            ELSE fecha_lectura
          END

      WHERE id_usuario = $1
        AND leida = FALSE

      RETURNING
        id_notificacion
      `,
      [idUsuario]
    );

  return {
    actualizadas:
      result.rowCount ?? 0,
  };
}
