export type TaskStatus =
  | "PENDIENTE"
  | "EN_PROCESO"
  | "COMPLETADA"
  | "CANCELADA";


export interface SiaTask {
  id_tarea: number;
  id_solicitud: number;
  id_tarea_padre: number | null;

  titulo: string;
  descripcion: string | null;
  estado: TaskStatus;

  fecha_asignacion: string;
  fecha_vencimiento: string | null;
  fecha_completada: string | null;

  id_usuario_asignado: number | null;

  usuario_nombre: string | null;
  usuario_apellido: string | null;
  usuario_email: string | null;

  id_departamento: number | null;
  departamento: string | null;
}


export interface TaskListResponse {
  status: string;
  total: number;
  tareas: SiaTask[];
}


export interface CreateTaskRequest {
  titulo: string;
  descripcion: string;
  fechaVencimiento: string;
}


export interface CreateTaskResponse {
  status: string;
  message: string;
  tarea: SiaTask;
}


export interface CreateSubtaskRequest {
  titulo: string;
  descripcion: string;
  fechaVencimiento: string;
}


export interface CreateSubtaskResponse {
  status: string;
  message: string;
  tarea: SiaTask;
}


export interface ChangeTaskStatusRequest {
  estado: TaskStatus;
}


export interface ChangeTaskStatusResponse {
  status: string;
  message: string;
  tarea: SiaTask;
}


export interface AssignTaskRequest {
  idUsuarioAsignado: number;
}


export interface AssignTaskResponse {
  status: string;
  message: string;
  tarea: SiaTask;
}