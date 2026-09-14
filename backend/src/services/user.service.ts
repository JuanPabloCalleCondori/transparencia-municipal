import bcrypt from "bcrypt";
import { pool } from "../config/database.js";

interface CreateUserData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  idRol: number;
  idDepartamento?: number | null;
}

interface UpdateUserData {
  nombre?: string;
  apellido?: string;
  email?: string;
  idRol?: number;
  idDepartamento?: number | null;
}

export async function createUser(data: CreateUserData) {
  const {
    nombre,
    apellido,
    email,
    password,
    idRol,
    idDepartamento,
  } = data;

  // Comprobar si el correo ya está registrado
  const existingUser = await pool.query(
    `
    SELECT id_usuario
    FROM usuarios
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
    `,
    [email]
  );

  if ((existingUser.rowCount ?? 0) > 0) {
    throw new Error("EMAIL_EXISTENTE");
  }

  // Comprobar que el rol existe y está activo
  const roleResult = await pool.query(
    `
    SELECT id_rol
    FROM roles
    WHERE id_rol = $1
      AND activo = TRUE
    `,
    [idRol]
  );

  if (roleResult.rowCount === 0) {
    throw new Error("ROL_INVALIDO");
  }

  // Comprobar departamento, si fue enviado
  if (idDepartamento !== null && idDepartamento !== undefined) {
    const departmentResult = await pool.query(
      `
      SELECT id_departamento
      FROM departamentos
      WHERE id_departamento = $1
        AND activo = TRUE
      `,
      [idDepartamento]
    );

    if (departmentResult.rowCount === 0) {
      throw new Error("DEPARTAMENTO_INVALIDO");
    }
  }

  // Nunca almacenamos la contraseña original
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `
    INSERT INTO usuarios (
      nombre,
      apellido,
      email,
      password_hash,
      id_rol,
      id_departamento
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id_usuario,
      nombre,
      apellido,
      email,
      id_rol,
      id_departamento,
      activo,
      fecha_creacion
    `,
    [
      nombre,
      apellido,
      email.toLowerCase(),
      passwordHash,
      idRol,
      idDepartamento ?? null,
    ]
  );

  return result.rows[0];
}

export async function getUsers() {
  const result = await pool.query(
    `
    SELECT
      u.id_usuario,
      u.nombre,
      u.apellido,
      u.email,
      u.activo,
      u.fecha_creacion,
      r.id_rol,
      r.nombre AS rol,
      d.id_departamento,
      d.nombre AS departamento
    FROM usuarios u
    INNER JOIN roles r
      ON r.id_rol = u.id_rol
    LEFT JOIN departamentos d
      ON d.id_departamento = u.id_departamento
    ORDER BY u.id_usuario
    `
  );

  return result.rows;
}

export async function updateUser(
  idUsuario: number,
  data: UpdateUserData
) {
  const userResult = await pool.query(
    `
    SELECT id_usuario
    FROM usuarios
    WHERE id_usuario = $1
    `,
    [idUsuario]
  );

  if (userResult.rowCount === 0) {
    throw new Error("USUARIO_NO_ENCONTRADO");
  }

  if (data.email !== undefined) {
    const emailResult = await pool.query(
      `
      SELECT id_usuario
      FROM usuarios
      WHERE LOWER(email) = LOWER($1)
        AND id_usuario <> $2
      `,
      [data.email, idUsuario]
    );

    if ((emailResult.rowCount ?? 0) > 0) {
      throw new Error("EMAIL_EXISTENTE");
    }
  }

  if (data.idRol !== undefined) {
    const roleResult = await pool.query(
      `
      SELECT id_rol
      FROM roles
      WHERE id_rol = $1
        AND activo = TRUE
      `,
      [data.idRol]
    );

    if (roleResult.rowCount === 0) {
      throw new Error("ROL_INVALIDO");
    }
  }

  if (
    data.idDepartamento !== undefined &&
    data.idDepartamento !== null
  ) {
    const departmentResult = await pool.query(
      `
      SELECT id_departamento
      FROM departamentos
      WHERE id_departamento = $1
        AND activo = TRUE
      `,
      [data.idDepartamento]
    );

    if (departmentResult.rowCount === 0) {
      throw new Error("DEPARTAMENTO_INVALIDO");
    }
  }

  const result = await pool.query(
    `
    UPDATE usuarios
    SET
      nombre = COALESCE($1, nombre),
      apellido = COALESCE($2, apellido),
      email = COALESCE($3, email),
      id_rol = COALESCE($4, id_rol),
      id_departamento =
        CASE
          WHEN $5::boolean = TRUE THEN $6
          ELSE id_departamento
        END,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_usuario = $7
    RETURNING
      id_usuario,
      nombre,
      apellido,
      email,
      id_rol,
      id_departamento,
      activo,
      fecha_actualizacion
    `,
    [
      data.nombre ?? null,
      data.apellido ?? null,
      data.email?.toLowerCase() ?? null,
      data.idRol ?? null,
      data.idDepartamento !== undefined,
      data.idDepartamento ?? null,
      idUsuario,
    ]
  );

  return result.rows[0];
}

export async function deactivateUser(idUsuario: number) {
  const result = await pool.query(
    `
    UPDATE usuarios
    SET
      activo = FALSE,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_usuario = $1
      AND activo = TRUE
    RETURNING
      id_usuario,
      nombre,
      apellido,
      email,
      activo,
      fecha_actualizacion
    `,
    [idUsuario]
  );

  if (result.rowCount === 0) {
    const exists = await pool.query(
      `
      SELECT id_usuario, activo
      FROM usuarios
      WHERE id_usuario = $1
      `,
      [idUsuario]
    );

    if (exists.rowCount === 0) {
      throw new Error("USUARIO_NO_ENCONTRADO");
    }

    throw new Error("USUARIO_YA_INACTIVO");
  }

  return result.rows[0];
}

export async function getAssignmentDepartments() {
  const result = await pool.query(
    `
    SELECT
      id_departamento,
      nombre
    FROM departamentos
    WHERE activo = TRUE
    ORDER BY nombre
    `
  );

  return result.rows;
}


export async function getAssignmentUsers() {
  const result = await pool.query(
    `
    SELECT
      u.id_usuario,
      u.nombre,
      u.apellido,
      u.id_departamento,
      d.nombre AS departamento
    FROM usuarios u
    INNER JOIN departamentos d
      ON d.id_departamento = u.id_departamento
    WHERE u.activo = TRUE
      AND d.activo = TRUE
    ORDER BY
      d.nombre,
      u.nombre,
      u.apellido
    `
  );

  return result.rows;
}