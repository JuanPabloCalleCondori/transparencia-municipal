export interface AuditEntry {
  id_auditoria: number;

  entidad: string;
  id_registro: number;

  accion: string;
  descripcion: string | null;

  datos_anteriores:
    | Record<string, unknown>
    | null;

  datos_nuevos:
    | Record<string, unknown>
    | null;

  ip_origen: string | null;

  fecha_hora: string;

  id_usuario: number | null;

  usuario_nombre: string | null;
  usuario_apellido: string | null;
  usuario_email: string | null;
}


export interface SiaHistoryRequest {
  idSolicitud: number;
  folio: string;
}


export interface SiaHistoryResponse {
  status: string;

  solicitud: SiaHistoryRequest;

  total: number;

  historial: AuditEntry[];
}
