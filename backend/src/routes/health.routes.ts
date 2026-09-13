import { Router } from "express";
import { pool } from "../config/database.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS fecha_servidor"
    );

    res.status(200).json({
      status: "ok",
      api: "online",
      database: "connected",
      fechaServidor: result.rows[0].fecha_servidor
    });
  } catch (error) {
    console.error("Error de conexión con PostgreSQL:", error);

    res.status(500).json({
      status: "error",
      api: "online",
      database: "disconnected"
    });
  }
});

export default router;
