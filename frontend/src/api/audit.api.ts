import {
  apiRequest,
} from "./api";

import type {
  SiaHistoryResponse,
} from "../types/audit";


export async function getSiaHistory(
  idSolicitud: number
) {
  return apiRequest<SiaHistoryResponse>(
    `/sia/${idSolicitud}/history`
  );
}
