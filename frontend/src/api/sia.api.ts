import {
  apiRequest,
} from "./api";

import type {
  CreateSiaRequest,
  CreateSiaResponse,
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


export async function createSiaRequest(
  data: CreateSiaRequest
): Promise<CreateSiaResponse> {
  return apiRequest<CreateSiaResponse>(
    "/sia",
    {
      method: "POST",

      body: JSON.stringify(
        data
      ),
    }
  );
}
