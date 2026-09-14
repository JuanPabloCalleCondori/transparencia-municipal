import {
  apiRequest,
} from "./api";

import type {
  SiaListResponse,
  SiaRequest,
} from "../types/sia";


export async function getSiaRequests(): Promise<
  SiaRequest[]
> {
  const response =
    await apiRequest<SiaListResponse>(
      "/sia"
    );

  return response.solicitudes;
}
