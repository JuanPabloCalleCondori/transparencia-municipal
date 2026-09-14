import {
  pool,
} from "../config/database.js";


/* =========================================================
   INTERFACES
   ========================================================= */

export interface CreateTransparencyItemData {
  nombre: string;
  descripcion?: string | null;
  idDepartamentoResponsable: number;
  periodicidad?: string;
}


export interface CreateTransparencyLoadData {
  idItem: number;
  idUsuarioResponsable: number;
  periodo: string;
}


export interface UpdateTransparencyLoadData {
  nombreArchivo: string;
  rutaArchivo: string;
}


/* =========================================================
   ÍTEMS DE TRANSPARENCIA
   ========================================================= */

export async function createTransparencyItem(
  data: CreateTransparencyItemData
) {
  /*
   * Validamos que el departamento exista
   * y esté activo.
   */
  const departamentoResult =
    await pool.query(
      `
      SELECT id_departamento
      FROM departamentos
      WHERE id_departamento = $1
        AND activo = TRUE
      `,
      [
        data.idDepartamentoResponsable,
      ]
    );

  if (
    departamentoResult.rowCount === 0
  ) {
    throw new Error(
      "DEPARTAMENTO_INVALIDO"
    );
  }

  const result =
    await pool.query(
      `
      INSERT INTO items_transparencia (
        nombre,
        descripcion,
        id_departamento_responsable,
        periodicidad,
        activo
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        TRUE
      )
      RETURNING *
      `,
      [
        data.nombre,
        data.descripcion ?? null,
        data.idDepartamentoResponsable,
        data.periodicidad ?? "MENSUAL",
      ]
    );

  return result.rows[0];
}


export async function getTransparencyItems() {
  const result =
    await pool.query(
      `
      SELECT
        i.id_item,
        i.nombre,
        i.descripcion,
        i.id_departamento_responsable,
        i.periodicidad,
        i.activo,
        i.fecha_creacion,

        d.nombre AS departamento_responsable

      FROM items_transparencia i

      INNER JOIN departamentos d
        ON d.id_departamento =
           i.id_departamento_responsable

      ORDER BY
        i.nombre ASC
      `
    );

  return result.rows;
}


export async function getTransparencyItemById(
  idItem: number
) {
  const result =
    await pool.query(
      `
      SELECT
        i.id_item,
        i.nombre,
        i.descripcion,
        i.id_departamento_responsable,
        i.periodicidad,
        i.activo,
        i.fecha_creacion,

        d.nombre AS departamento_responsable

      FROM items_transparencia i

      INNER JOIN departamentos d
        ON d.id_departamento =
           i.id_departamento_responsable

      WHERE i.id_item = $1
      `,
      [idItem]
    );

  if (
    result.rowCount === 0
  ) {
    throw new Error(
      "ITEM_NO_ENCONTRADO"
    );
  }

  return result.rows[0];
}


/* =========================================================
   CARGAS MENSUALES
   ========================================================= */

export async function createTransparencyLoad(
  data: CreateTransparencyLoadData
) {
  /*
   * Verificamos que el ítem exista
   * y esté activo.
   */
  const itemResult =
    await pool.query(
      `
      SELECT
        id_item,
        id_departamento_responsable
      FROM items_transparencia
      WHERE id_item = $1
        AND activo = TRUE
      `,
      [data.idItem]
    );

  if (
    itemResult.rowCount === 0
  ) {
    throw new Error(
      "ITEM_NO_ENCONTRADO"
    );
  }

  /*
   * Verificamos que el responsable
   * exista y esté activo.
   */
  const usuarioResult =
    await pool.query(
      `
      SELECT
        id_usuario,
        id_departamento
      FROM usuarios
      WHERE id_usuario = $1
        AND activo = TRUE
      `,
      [
        data.idUsuarioResponsable,
      ]
    );

  if (
    usuarioResult.rowCount === 0
  ) {
    throw new Error(
      "RESPONSABLE_INVALIDO"
    );
  }

  /*
   * El dueño de información debe
   * pertenecer al departamento
   * responsable del ítem.
   */
  if (
    usuarioResult.rows[0]
      .id_departamento !==
    itemResult.rows[0]
      .id_departamento_responsable
  ) {
    throw new Error(
      "RESPONSABLE_OTRO_DEPARTAMENTO"
    );
  }

  try {
    const result =
      await pool.query(
        `
        INSERT INTO cargas_transparencia (
          id_item,
          id_usuario_responsable,
          periodo,
          estado
        )
        VALUES (
          $1,
          $2,
          $3,
          'PENDIENTE'
        )
        RETURNING *
        `,
        [
          data.idItem,
          data.idUsuarioResponsable,
          data.periodo,
        ]
      );

    return result.rows[0];
  } catch (error: any) {
    /*
     * PostgreSQL 23505 =
     * violación de UNIQUE.
     */
    if (
      error?.code === "23505"
    ) {
      throw new Error(
        "CARGA_PERIODO_DUPLICADA"
      );
    }

    throw error;
  }
}


export async function getTransparencyLoads(
  periodo?: string
) {
  const values: unknown[] = [];

  let where = "";

  if (periodo) {
    values.push(periodo);

    where =
      `WHERE c.periodo = $1`;
  }

  const result =
    await pool.query(
      `
      SELECT
        c.id_carga,
        c.id_item,
        c.id_usuario_responsable,
        c.id_usuario_validador,
        c.periodo,
        c.estado,
        c.nombre_archivo,
        c.ruta_archivo,
        c.observacion,
        c.fecha_carga,
        c.fecha_validacion,
        c.fecha_publicacion,
        c.fecha_creacion,

        i.nombre AS item,

        d.nombre AS departamento,

        CONCAT(
          ur.nombre,
          ' ',
          ur.apellido
        ) AS responsable,

        CONCAT(
          uv.nombre,
          ' ',
          uv.apellido
        ) AS validador

      FROM cargas_transparencia c

      INNER JOIN items_transparencia i
        ON i.id_item = c.id_item

      INNER JOIN departamentos d
        ON d.id_departamento =
           i.id_departamento_responsable

      INNER JOIN usuarios ur
        ON ur.id_usuario =
           c.id_usuario_responsable

      LEFT JOIN usuarios uv
        ON uv.id_usuario =
           c.id_usuario_validador

      ${where}

      ORDER BY
        c.periodo DESC,
        c.id_carga DESC
      `,
      values
    );

  return result.rows;
}


export async function getTransparencyLoadById(
  idCarga: number
) {
  const result =
    await pool.query(
      `
      SELECT
        c.*,

        i.nombre AS item,

        i.id_departamento_responsable,

        d.nombre AS departamento,

        CONCAT(
          ur.nombre,
          ' ',
          ur.apellido
        ) AS responsable,

        CONCAT(
          uv.nombre,
          ' ',
          uv.apellido
        ) AS validador

      FROM cargas_transparencia c

      INNER JOIN items_transparencia i
        ON i.id_item = c.id_item

      INNER JOIN departamentos d
        ON d.id_departamento =
           i.id_departamento_responsable

      INNER JOIN usuarios ur
        ON ur.id_usuario =
           c.id_usuario_responsable

      LEFT JOIN usuarios uv
        ON uv.id_usuario =
           c.id_usuario_validador

      WHERE c.id_carga = $1
      `,
      [idCarga]
    );

  if (
    result.rowCount === 0
  ) {
    throw new Error(
      "CARGA_NO_ENCONTRADA"
    );
  }

  return result.rows[0];
}


/* =========================================================
   CARGA DE ARCHIVO
   ========================================================= */

export async function attachTransparencyFile(
  idCarga: number,
  data: UpdateTransparencyLoadData
) {
  const carga =
    await getTransparencyLoadById(
      idCarga
    );

  /*
   * No permitimos modificar algo
   * que ya fue publicado.
   */
  if (
    carga.estado === "PUBLICADO"
  ) {
    throw new Error(
      "CARGA_YA_PUBLICADA"
    );
  }

  const result =
    await pool.query(
      `
      UPDATE cargas_transparencia
      SET
        nombre_archivo = $1,
        ruta_archivo = $2,
        estado = 'EN_REVISION',
        fecha_carga = CURRENT_TIMESTAMP,
        observacion = NULL
      WHERE id_carga = $3
      RETURNING *
      `,
      [
        data.nombreArchivo,
        data.rutaArchivo,
        idCarga,
      ]
    );

  return result.rows[0];
}


/* =========================================================
   VALIDACIÓN
   ========================================================= */

export async function validateTransparencyLoad(
  idCarga: number,
  idUsuarioValidador: number,
  decision: "APROBADO" | "RECHAZADO",
  observacion?: string | null
) {
  const carga =
    await getTransparencyLoadById(
      idCarga
    );

  if (
    carga.estado !==
    "EN_REVISION"
  ) {
    throw new Error(
      "CARGA_NO_ESTA_EN_REVISION"
    );
  }

  if (
    decision === "RECHAZADO" &&
    !observacion?.trim()
  ) {
    throw new Error(
      "OBSERVACION_REQUERIDA"
    );
  }

  const result =
    await pool.query(
      `
      UPDATE cargas_transparencia
      SET
        estado = $1,
        id_usuario_validador = $2,
        observacion = $3,
        fecha_validacion =
          CURRENT_TIMESTAMP
      WHERE id_carga = $4
      RETURNING *
      `,
      [
        decision,
        idUsuarioValidador,
        observacion?.trim() || null,
        idCarga,
      ]
    );

  return result.rows[0];
}


/* =========================================================
   PUBLICACIÓN
   ========================================================= */

export async function publishTransparencyLoad(
  idCarga: number
) {
  const carga =
    await getTransparencyLoadById(
      idCarga
    );

  if (
    carga.estado !== "APROBADO"
  ) {
    throw new Error(
      "CARGA_NO_APROBADA"
    );
  }

  const result =
    await pool.query(
      `
      UPDATE cargas_transparencia
      SET
        estado = 'PUBLICADO',
        fecha_publicacion =
          CURRENT_TIMESTAMP
      WHERE id_carga = $1
      RETURNING *
      `,
      [idCarga]
    );

  return result.rows[0];
}
