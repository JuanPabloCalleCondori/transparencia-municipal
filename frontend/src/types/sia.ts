export type SiaTrafficLight =
  | "VERDE"
  | "AMARILLO"
  | "ROJO";

export interface SiaRequest {
  id_solicitud: number;
  folio: string;

  nombre_solicitante: string;
  email_solicitante: string;

  descripcion: string;

  fecha_ingreso: string;
  fecha_vencimiento: string;
  fecha_cierre: string | null;

  tiene_prorroga: boolean;

  id_estado: number;
  estado: string;

  id_departamento: number | null;
  departamento: string | null;

  id_responsable: number | null;
  responsable: string | null;
}

export interface SiaListResponse {
  status: string;
  total: number;
  solicitudes: SiaRequest[];
}

export interface CreateSiaRequest {
  nombre_solicitante: string;
  email_solicitante: string;
  descripcion: string;
}

export interface CreateSiaRequest {
  nombreSolicitante: string;
  emailSolicitante?: string;
  descripcion: string;
}