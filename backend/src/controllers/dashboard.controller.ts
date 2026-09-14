import type {
  Request,
  Response,
} from "express";

import {
  getDashboardSummary,
} from "../services/dashboard.service.js";


export async function summary(
  _req: Request,
  res: Response
) {
  try {
    const dashboard =
      await getDashboardSummary();

    return res.status(200).json({
      status: "ok",
      dashboard,
    });
  } catch (error) {
    console.error(
      "Error obteniendo dashboard:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Error obteniendo indicadores del sistema",
    });
  }
}
