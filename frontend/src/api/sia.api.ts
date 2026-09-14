import {
  apiRequest,
} from "./api";

import type {
  AssignSiaRequest,
  AssignSiaResponse,
  AssignmentOptionsResponse,
  ChangeSiaStatusRequest,
  ChangeSiaStatusResponse,
  CreateSiaRequest,
  CreateSiaResponse,
  SiaDetailResponse,
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

export async function getSiaRequestById(
  id: number
): Promise<SiaDetailResponse> {
  return apiRequest<SiaDetailResponse>(
    `/sia/${id}`
  );
}

export async function getAssignmentOptions(): Promise<
  AssignmentOptionsResponse
> {
  return apiRequest<AssignmentOptionsResponse>(
    "/sia/assignment-options"
  );
}


export async function assignSiaRequest(
  idSolicitud: number,
  data: AssignSiaRequest
): Promise<AssignSiaResponse> {
  return apiRequest<AssignSiaResponse>(
    `/sia/${idSolicitud}/assign`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function changeSiaStatus(
  idSolicitud: number,
  data: ChangeSiaStatusRequest
): Promise<ChangeSiaStatusResponse> {
  return apiRequest<ChangeSiaStatusResponse>(
    `/sia/${idSolicitud}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}