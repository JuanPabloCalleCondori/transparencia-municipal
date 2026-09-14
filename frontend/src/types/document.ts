export interface SiaDocument {
  id_documento: number;
  id_solicitud: number;
  id_usuario: number;

  nombre_archivo: string;
  nombre_original: string;
  nombre_almacenado: string;

  tipo_mime: string;
  tamano_bytes: number;
  fecha_creacion: string;

  nombre: string;
  apellido: string;
  email: string;

  rol: string;
  departamento: string | null;
}


export interface SiaDocumentListResponse {
  status: string;
  total: number;
  documentos: SiaDocument[];
}


export interface UploadedSiaDocument {
  id_documento: number;
  id_solicitud: number;
  id_usuario: number;

  nombre_archivo: string;
  ruta_archivo: string;

  nombre_original: string;
  nombre_almacenado: string;
  tipo_mime: string;
  tamano_bytes: number;

  fecha_creacion: string;
}


export interface UploadSiaDocumentResponse {
  status: string;
  message: string;
  documento: UploadedSiaDocument;
}


export interface DeleteSiaDocumentResponse {
  status: string;
  message: string;
}
