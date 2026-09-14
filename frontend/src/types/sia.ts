export type SiaTrafficLight =
  | "VERDE"
  | "AMARILLO"
  | "ROJO";

export interface SiaRequest {
  id_solicitud: number;
  folio: string;

  nombre_solicitante: string;
  email_solicitante: string | null;

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

  responsable?: string | null;
  responsable_nombre?: string | null;
  responsable_apellido?: string | null;
  responsable_email?: string | null;
}

export interface SiaListResponse {
  status: string;
  total: number;
  solicitudes: SiaRequest[];
}

export interface CreateSiaRequest {
  nombreSolicitante: string;
  emailSolicitante?: string;
  descripcion: string;
}

export interface CreateSiaResponse {
  status: string;
  message?: string;
  solicitud: SiaRequest;
}

export interface SiaDeadline {
  diasRestantes: number;
  semaforo: string;
  vencida: boolean;
}

export interface SiaDetailResponse {
  status: string;
  solicitud: SiaRequest;
  plazo: SiaDeadline;
}

export interface AssignmentDepartment {
  id_departamento: number;
  nombre: string;
}

export interface AssignmentUser {
  id_usuario: number;
  nombre: string;
  apellido: string;
  id_departamento: number;
  departamento: string;
}

export interface AssignmentOptionsResponse {
  status: string;
  departamentos: AssignmentDepartment[];
  usuarios: AssignmentUser[];
}

export interface AssignSiaRequest {
  idDepartamento: number;
  idResponsable: number;
}

export interface AssignSiaResponse {
  status: string;
  message: string;
  solicitud: SiaRequest;
}

export interface ChangeSiaStatusRequest {
  idEstado: number;
}

export interface ChangeSiaStatusResponse {
  status: string;
  message: string;
  solicitud: SiaRequest;
}

export interface CreateSiaExtensionRequest {
  motivo: string;
}

export interface SiaExtension {
  id_prorroga: number;
  id_solicitud: number;
  id_usuario: number;
  motivo: string;
  dias_prorroga: number;
  aprobada: boolean;
  fecha_resolucion: string | null;
  numero_resolucion: string | null;
}

export interface CreateSiaExtensionResponse {
  status: string;
  message: string;
  solicitud: SiaRequest;
  prorroga: SiaExtension;
  plazo: {
    fechaIngreso: string;
    fechaVencimiento: string;
    diasHabilesRestantes: number;
    vencida: boolean;
    semaforo: string;
  };
}
