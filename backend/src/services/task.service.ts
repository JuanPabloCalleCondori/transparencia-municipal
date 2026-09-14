import { pool } from "../config/database.js";

export interface CreateTaskData {
  idSolicitud: number;
  idUsuarioAsignado?: number | null;
  titulo: string;
  descripcion?: string | null;
  fechaVencimiento?: string | null;
  idTareaPadre?: number | null;
}

async function validateRequest(idSolicitud: number) {
  const result = await pool.query(
    `
    SELECT id_solicitud
    FROM solicitudes_sia
    WHERE id_solicitud = $1
    `,
    [idSolicitud]
  );

  if (result.rowCount === 0) {
    throw new Error("SOLICITUD_NO_ENCONTRADA");
  }
}

async function validateAssignedUser(
  idUsuario: number
) {
  const result = await pool.query(
    `
    SELECT id_usuario
    FROM usuarios
    WHERE id_usuario = $1
      AND activo = TRUE
    `,
    [idUsuario]
  );

  if (result.rowCount === 0) {
    throw new Error("USUARIO_INVALIDO");
  }
}

async function validateParentTask(
  idTareaPadre: number,
  idSolicitud: number
) {
  const result = await pool.query(
    `
    SELECT
      id_tarea,
      id_solicitud,
      id_tarea_padre
    FROM tareas
    WHERE id_tarea = $1
    `,
    [idTareaPadre]
  );

  if (result.rowCount === 0) {
    throw new Error("TAREA_PADRE_NO_ENCONTRADA");
  }

  const tareaPadre = result.rows[0];

  if (tareaPadre.id_solicitud !== idSolicitud) {
    throw new Error("TAREA_PADRE_OTRA_SOLICITUD");
  }

  /*
   * Para este proyecto mantenemos solamente
   * dos niveles:
   *
   * Tarea Madre
   *    └── Subtarea
   */
  if (tareaPadre.id_tarea_padre !== null) {
    throw new Error("SUBTAREA_NO_PUEDE_SER_PADRE");
  }
}

export async function createTask(
  data: CreateTaskData
) {
  const {
    idSolicitud,
    idUsuarioAsignado = null,
    titulo,
    descripcion = null,
    fechaVencimiento = null,
    idTareaPadre = null,
  } = data;

  await validateRequest(idSolicitud);

  if (idUsuarioAsignado !== null) {
    await validateAssignedUser(idUsuarioAsignado);
  }

  if (idTareaPadre !== null) {
    await validateParentTask(
      idTareaPadre,
      idSolicitud
    );
  }

  const result = await pool.query(
    `
    INSERT INTO tareas (
      id_solicitud,
      id_usuario_asignado,
      titulo,
      descripcion,
      estado,
      fecha_vencimiento,
      id_tarea_padre
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      'PENDIENTE',
      $5,
      $6
    )
    RETURNING *
    `,
    [
      idSolicitud,
      idUsuarioAsignado,
      titulo,
      descripcion,
      fechaVencimiento,
      idTareaPadre,
    ]
  );

  return result.rows[0];
}

export async function getTasksByRequest(
  idSolicitud: number
) {
  await validateRequest(idSolicitud);

  const result = await pool.query(
    `
    SELECT
      t.id_tarea,
      t.id_solicitud,
      t.id_tarea_padre,
      t.titulo,
      t.descripcion,
      t.estado,
      t.fecha_asignacion,
      t.fecha_vencimiento,
      t.fecha_completada,

      u.id_usuario AS id_usuario_asignado,
      u.nombre AS usuario_nombre,
      u.apellido AS usuario_apellido,
      u.email AS usuario_email,

      d.id_departamento,
      d.nombre AS departamento

    FROM tareas t

    LEFT JOIN usuarios u
      ON u.id_usuario = t.id_usuario_asignado

    LEFT JOIN departamentos d
      ON d.id_departamento = u.id_departamento

    WHERE t.id_solicitud = $1

    ORDER BY
      CASE
        WHEN t.id_tarea_padre IS NULL
        THEN t.id_tarea
        ELSE t.id_tarea_padre
      END,
      t.id_tarea_padre NULLS FIRST,
      t.id_tarea
    `,
    [idSolicitud]
  );

  return result.rows;
}

export async function getTaskById(
  idSolicitud: number,
  idTarea: number
) {
  const result = await pool.query(
    `
    SELECT
      t.id_tarea,
      t.id_solicitud,
      t.id_tarea_padre,
      t.titulo,
      t.descripcion,
      t.estado,
      t.fecha_asignacion,
      t.fecha_vencimiento,
      t.fecha_completada,

      u.id_usuario AS id_usuario_asignado,
      u.nombre AS usuario_nombre,
      u.apellido AS usuario_apellido,
      u.email AS usuario_email,

      d.id_departamento,
      d.nombre AS departamento

    FROM tareas t

    LEFT JOIN usuarios u
      ON u.id_usuario = t.id_usuario_asignado

    LEFT JOIN departamentos d
      ON d.id_departamento = u.id_departamento

    WHERE t.id_tarea = $1
      AND t.id_solicitud = $2
    `,
    [idTarea, idSolicitud]
  );

  if (result.rowCount === 0) {
    throw new Error("TAREA_NO_ENCONTRADA");
  }

  return result.rows[0];
}

export async function changeTaskStatus(
  idSolicitud: number,
  idTarea: number,
  estado: string
) {
  const estadosPermitidos = [
    "PENDIENTE",
    "EN_PROCESO",
    "COMPLETADA",
    "CANCELADA",
  ];

  if (!estadosPermitidos.includes(estado)) {
    throw new Error("ESTADO_TAREA_INVALIDO");
  }

  // Verificamos que la tarea exista y pertenezca a la solicitud.
  await getTaskById(idSolicitud, idTarea);

  const esCompletada = estado === "COMPLETADA";

  const result = await pool.query(
    `
    UPDATE tareas
    SET
      estado = CAST($1 AS VARCHAR(30)),
      fecha_completada =
        CASE
          WHEN CAST($2 AS BOOLEAN) = TRUE
            THEN CURRENT_TIMESTAMP
          ELSE NULL
        END
    WHERE id_tarea = CAST($3 AS INTEGER)
      AND id_solicitud = CAST($4 AS INTEGER)
    RETURNING
      id_tarea,
      id_solicitud,
      id_usuario_asignado,
      titulo,
      descripcion,
      estado,
      fecha_asignacion,
      fecha_vencimiento,
      fecha_completada,
      id_tarea_padre
    `,
    [
      estado,
      esCompletada,
      idTarea,
      idSolicitud,
    ]
  );

  if (result.rowCount === 0) {
    throw new Error("TAREA_NO_ENCONTRADA");
  }

  return result.rows[0];
}