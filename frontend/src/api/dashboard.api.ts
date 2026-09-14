import {
  apiRequest,
} from "./api";

import type {
  DashboardSummary,
} from "../types/dashboard";

interface DashboardResponse {
  status: string;
  dashboard: DashboardSummary;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response =
    await apiRequest<DashboardResponse>(
      "/dashboard/summary"
    );

  return response.dashboard;
}
