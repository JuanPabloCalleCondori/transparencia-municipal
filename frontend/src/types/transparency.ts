export type TransparencyStatus =
  | "PENDIENTE"
  | "EN_REVISION"
  | "APROBADO"
  | "RECHAZADO"
  | "PUBLICADO";


export interface TransparencyItem {
  id_item: number;
  nombre: string;
  descripcion: string | null;

  id_departamento_responsable: number;

  periodicidad: string;

  activo: boolean;

  fecha_creacion: string;

  departamento_responsable: string;
}


export interface TransparencyLoad {
  id_carga: number;

  id_item: number;

  id_usuario_responsable: number;

  id_usuario_validador:
    | number
    | null;

  periodo: string;

  estado: TransparencyStatus;

  nombre_archivo:
    | string
    | null;

  ruta_archivo:
    | string
    | null;

  observacion:
    | string
    | null;

  fecha_carga:
    | string
    | null;

  fecha_validacion:
    | string
    | null;

  fecha_publicacion:
    | string
    | null;

  fecha_creacion: string;

  item: string;

  departamento: string;

  responsable: string;

  validador:
    | string
    | null;

  id_departamento_responsable?:
    number;
}


export interface TransparencyItemsResponse {
  status: string;

  total: number;

  items: TransparencyItem[];
}


export interface TransparencyItemResponse {
  status: string;

  item: TransparencyItem;
}


export interface TransparencyLoadsResponse {
  status: string;

  total: number;

  cargas: TransparencyLoad[];
}


export interface TransparencyLoadResponse {
  status: string;

  carga: TransparencyLoad;
}


export interface CreateTransparencyLoadData {
  idItem: number;

  idUsuarioResponsable: number;

  periodo: string;
}


export interface CreateTransparencyItemData {
  nombre: string;

  descripcion?: string;

  idDepartamentoResponsable: number;

  periodicidad?: string;
}


export interface ValidateTransparencyLoadData {
  decision:
    | "APROBADO"
    | "RECHAZADO";

  observacion?: string;
}

export interface TransparencyDepartment {
  id_departamento: number;
  nombre: string;
}


export interface TransparencyUser {
  id_usuario: number;
  nombre: string;
  apellido: string;

  id_departamento: number;

  departamento: string;
}


export interface TransparencyAssignmentOptionsResponse {
  status: string;

  departamentos:
    TransparencyDepartment[];

  usuarios:
    TransparencyUser[];
}
