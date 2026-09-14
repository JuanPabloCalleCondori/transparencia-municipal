import { pool } from "../config/database.js";


export interface CreateTaskData {
  idSolicitud: number;
  idUsuarioAsignado?: number | null;
  titulo: string;
  descripcion?: string | null;
  fechaVencimiento?: string | null;
  idTareaPadre?: number | null;
}


export interface TaskActor {
  idUsuario: number;
  rol: string;
}


/*
 * =========================================================
 * VALIDAR SOLICITUD
 * =========================================================
 */

async function getRequestState(
  idSolicitud: number
) {
  const result =
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
    result.rowCount === 0
  ) {
    throw new Error(
      "SOLICITUD_NO_ENCONTRADA"
    );
  }

  return result.rows[0];
}


async function validateOpenRequest(
  idSolicitud: number
) {
  const solicitud =
    await getRequestState(
      idSolicitud
    );

  if (
    solicitud.estado ===
      "FINALIZADA" ||
    solicitud.estado ===
      "CANCELADA"
  ) {
    throw new Error(
      "SOLICITUD_CERRADA"
    );
  }
}


/*
 * =========================================================
 * VALIDAR USUARIO
 * =========================================================
 */

async function validateAssignedUser(
  idUsuario: number
) {
  const result =
    await pool.query(
      `
      SELECT id_usuario

      FROM usuarios

      WHERE id_usuario = $1
        AND activo = TRUE
      `,
      [
        idUsuario,
      ]
    );

  if (
    result.rowCount === 0
  ) {
    throw new Error(
      "USUARIO_INVALIDO"
    );
  }
}


/*
 * =========================================================
 * VALIDAR TAREA PADRE
 * =========================================================
 */

async function validateParentTask(
  idTareaPadre: number,
  idSolicitud: number
) {
  const result =
    await pool.query(
      `
      SELECT
        id_tarea,
        id_solicitud,
        id_tarea_padre

      FROM tareas

      WHERE id_tarea = $1
      `,
      [
        idTareaPadre,
      ]
    );

  if (
    result.rowCount === 0
  ) {
    throw new Error(
      "TAREA_PADRE_NO_ENCONTRADA"
    );
  }

  const tareaPadre =
    result.rows[0];

  if (
    tareaPadre.id_solicitud !==
    idSolicitud
  ) {
    throw new Error(
      "TAREA_PADRE_OTRA_SOLICITUD"
    );
  }

  /*
   * Solo permitimos dos niveles:
   *
   * Tarea Madre
   *   └── Subtarea
   */
  if (
    tareaPadre.id_tarea_padre !==
    null
  ) {
    throw new Error(
      "SUBTAREA_NO_PUEDE_SER_PADRE"
    );
  }

  /*
   * Una tarea madre cerrada tampoco
   * debería recibir nuevas subtareas.
   */
  const stateResult =
    await pool.query(
      `
      SELECT estado

      FROM tareas

      WHERE id_tarea = $1
      `,
      [
        idTareaPadre,
      ]
    );

  const estado =
    stateResult.rows[0].estado;

  if (
    estado === "COMPLETADA" ||
    estado === "CANCELADA"
  ) {
    throw new Error(
      "TAREA_PADRE_CERRADA"
    );
  }
}


/*
 * =========================================================
 * VALIDAR TAREA MADRE ÚNICA
 * =========================================================
 */

async function validateMotherTaskUnique(
  idSolicitud: number
) {
  const result =
    await pool.query(
      `
      SELECT id_tarea

      FROM tareas

      WHERE
        id_solicitud = $1
        AND id_tarea_padre IS NULL

      LIMIT 1
      `,
      [
        idSolicitud,
      ]
    );

  if (
    result.rowCount !== 0
  ) {
    throw new Error(
      "TAREA_MADRE_YA_EXISTENTE"
    );
  }
}


/*
 * =========================================================
 * CREAR TAREA / SUBTAREA
 * =========================================================
 */

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

  /*
   * No se pueden agregar tareas
   * a solicitudes cerradas.
   */
  await validateOpenRequest(
    idSolicitud
  );

  if (
    idUsuarioAsignado !== null
  ) {
    await validateAssignedUser(
      idUsuarioAsignado
    );
  }

  if (
    idTareaPadre !== null
  ) {
    await validateParentTask(
      idTareaPadre,
      idSolicitud
    );
  } else {
    /*
     * Solo una tarea madre
     * por solicitud.
     */
    await validateMotherTaskUnique(
      idSolicitud
    );
  }

  const result =
    await pool.query(
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


/*
 * =========================================================
 * LISTAR TAREAS
 * =========================================================
 */

export async function getTasksByRequest(
  idSolicitud: number
) {
  /*
   * Aquí solo verificamos existencia.
   * Una solicitud cerrada debe seguir
   * mostrando su historial de tareas.
   */
  await getRequestState(
    idSolicitud
  );

  const result =
    await pool.query(
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

        u.id_usuario
          AS id_usuario_asignado,

        u.nombre
          AS usuario_nombre,

        u.apellido
          AS usuario_apellido,

        u.email
          AS usuario_email,

        d.id_departamento,
        d.nombre
          AS departamento

      FROM tareas t

      LEFT JOIN usuarios u
        ON u.id_usuario =
           t.id_usuario_asignado

      LEFT JOIN departamentos d
        ON d.id_departamento =
           u.id_departamento

      WHERE
        t.id_solicitud = $1

      ORDER BY
        CASE
          WHEN
            t.id_tarea_padre
            IS NULL

          THEN t.id_tarea

          ELSE
            t.id_tarea_padre
        END,

        t.id_tarea_padre
          NULLS FIRST,

        t.id_tarea
      `,
      [
        idSolicitud,
      ]
    );

  return result.rows;
}


/*
 * =========================================================
 * OBTENER TAREA
 * =========================================================
 */

export async function getTaskById(
  idSolicitud: number,
  idTarea: number
) {
  const result =
    await pool.query(
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

        u.id_usuario
          AS id_usuario_asignado,

        u.nombre
          AS usuario_nombre,

        u.apellido
          AS usuario_apellido,

        u.email
          AS usuario_email,

        d.id_departamento,

        d.nombre
          AS departamento

      FROM tareas t

      LEFT JOIN usuarios u
        ON u.id_usuario =
           t.id_usuario_asignado

      LEFT JOIN departamentos d
        ON d.id_departamento =
           u.id_departamento

      WHERE
        t.id_tarea = $1
        AND t.id_solicitud = $2
      `,
      [
        idTarea,
        idSolicitud,
      ]
    );

  if (
    result.rowCount === 0
  ) {
    throw new Error(
      "TAREA_NO_ENCONTRADA"
    );
  }

  return result.rows[0];
}


/*
 * =========================================================
 * CAMBIAR ESTADO
 * =========================================================
 */

export async function changeTaskStatus(
  idSolicitud: number,
  idTarea: number,
  estado: string,
  actor: TaskActor
) {
  const estadosPermitidos = [
    "PENDIENTE",
    "EN_PROCESO",
    "COMPLETADA",
    "CANCELADA",
  ];

  if (
    !estadosPermitidos.includes(
      estado
    )
  ) {
    throw new Error(
      "ESTADO_TAREA_INVALIDO"
    );
  }

  /*
   * Si la solicitud está cerrada,
   * tampoco modificamos sus tareas.
   */
  await validateOpenRequest(
    idSolicitud
  );

  const tarea =
    await getTaskById(
      idSolicitud,
      idTarea
    );

  /*
   * Un funcionario operativo
   * únicamente puede modificar
   * tareas asignadas a él.
   */
  if (
    actor.rol ===
      "FUNCIONARIO_OPERATIVO" &&
    tarea.id_usuario_asignado !==
      actor.idUsuario
  ) {
    throw new Error(
      "TAREA_NO_ASIGNADA_AL_USUARIO"
    );
  }

  /*
   * Una tarea completada o cancelada
   * es terminal.
   */
  if (
    tarea.estado ===
      "COMPLETADA" ||
    tarea.estado ===
      "CANCELADA"
  ) {
    throw new Error(
      "TAREA_CERRADA"
    );
  }

  /*
   * Flujo permitido:
   *
   * PENDIENTE
   *   -> EN_PROCESO
   *   -> COMPLETADA
   *   -> CANCELADA
   *
   * EN_PROCESO
   *   -> COMPLETADA
   *   -> CANCELADA
   *
   * Se permite completar directamente
   * una tarea simple desde PENDIENTE.
   */
  const transiciones:
    Record<string, string[]> = {
      PENDIENTE: [
        "EN_PROCESO",
        "COMPLETADA",
        "CANCELADA",
      ],

      EN_PROCESO: [
        "COMPLETADA",
        "CANCELADA",
      ],
    };

  const permitidos =
    transiciones[tarea.estado] ?? [];

  if (
    !permitidos.includes(
      estado
    )
  ) {
    throw new Error(
      "TRANSICION_TAREA_INVALIDA"
    );
  }

  const esCompletada =
    estado === "COMPLETADA";

  const result =
    await pool.query(
      `
      UPDATE tareas

      SET
        estado =
          CAST(
            $1 AS VARCHAR(30)
          ),

        fecha_completada =
          CASE
            WHEN
              CAST(
                $2 AS BOOLEAN
              ) = TRUE

            THEN
              CURRENT_TIMESTAMP

            ELSE
              fecha_completada
          END

      WHERE
        id_tarea =
          CAST(
            $3 AS INTEGER
          )

        AND id_solicitud =
          CAST(
            $4 AS INTEGER
          )

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

  if (
    result.rowCount === 0
  ) {
    throw new Error(
      "TAREA_NO_ENCONTRADA"
    );
  }

  return result.rows[0];
}

export async function assignTaskResponsible(
  idSolicitud: number,
  idTarea: number,
  idUsuarioAsignado: number
) {
  /*
   * Verificamos que la tarea exista
   * y pertenezca a la solicitud.
   */
  await getTaskById(
    idSolicitud,
    idTarea
  );


  /*
   * Verificamos que la solicitud
   * siga abierta.
   */
  const requestResult =
    await pool.query(
      `
      SELECT
        s.id_solicitud,
        e.nombre AS estado
      FROM solicitudes_sia s
      INNER JOIN estados_solicitud e
        ON e.id_estado = s.id_estado
      WHERE s.id_solicitud = $1
      `,
      [idSolicitud]
    );


  if (
    requestResult.rowCount === 0
  ) {
    throw new Error(
      "SOLICITUD_NO_ENCONTRADA"
    );
  }


  const estadoSolicitud =
    requestResult.rows[0].estado;


  if (
    estadoSolicitud === "FINALIZADA" ||
    estadoSolicitud === "CANCELADA"
  ) {
    throw new Error(
      "SOLICITUD_CERRADA"
    );
  }


  /*
   * Validamos que el usuario
   * exista y esté activo.
   */
  const userResult =
    await pool.query(
      `
      SELECT
        id_usuario
      FROM usuarios
      WHERE id_usuario = $1
        AND activo = TRUE
      `,
      [idUsuarioAsignado]
    );


  if (
    userResult.rowCount === 0
  ) {
    throw new Error(
      "USUARIO_INVALIDO"
    );
  }


  /*
   * Asignamos el nuevo responsable.
   */
  const result =
    await pool.query(
      `
      UPDATE tareas
      SET
        id_usuario_asignado = $1
      WHERE id_tarea = $2
        AND id_solicitud = $3
      RETURNING *
      `,
      [
        idUsuarioAsignado,
        idTarea,
        idSolicitud,
      ]
    );


  if (
    result.rowCount === 0
  ) {
    throw new Error(
      "TAREA_NO_ENCONTRADA"
    );
  }


  /*
   * Devolvemos la tarea mediante
   * getTaskById para recuperar
   * también nombre, apellido,
   * departamento, etc.
   */
  return getTaskById(
    idSolicitud,
    idTarea
  );
}
