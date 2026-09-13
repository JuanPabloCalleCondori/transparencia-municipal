import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";

interface LoginData {
  email: string;
  password: string;
}

export async function loginUser({ email, password }: LoginData) {
  const result = await pool.query(
    `
    SELECT
      u.id_usuario,
      u.nombre,
      u.apellido,
      u.email,
      u.password_hash,
      u.activo,
      r.nombre AS rol,
      d.id_departamento,
      d.nombre AS departamento
    FROM usuarios u
    INNER JOIN roles r
      ON r.id_rol = u.id_rol
    LEFT JOIN departamentos d
      ON d.id_departamento = u.id_departamento
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1
    `,
    [email]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const usuario = result.rows[0];

  if (!usuario.activo) {
    throw new Error("USUARIO_INACTIVO");
  }

  const passwordValida = await bcrypt.compare(
    password,
    usuario.password_hash
  );

  if (!passwordValida) {
    return null;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET_NO_CONFIGURADO");
  }

  const token = jwt.sign(
    {
      idUsuario: usuario.id_usuario,
      email: usuario.email,
      rol: usuario.rol,
    },
    jwtSecret,
    {
      expiresIn: "8h",
    }
  );

  return {
    token,
    usuario: {
      id: usuario.id_usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      departamento: usuario.departamento
        ? {
            id: usuario.id_departamento,
            nombre: usuario.departamento,
          }
        : null,
    },
  };
}
