import {
  apiRequest,
} from "./api";

import type {
  ChangeTaskStatusRequest,
  ChangeTaskStatusResponse,
  CreateSubtaskRequest,
  CreateSubtaskResponse,
  CreateTaskRequest,
  CreateTaskResponse,
  TaskListResponse,
} from "../types/task";


/*
 * Obtener todas las tareas
 * asociadas a una solicitud SIA.
 */
export async function getSiaTasks(
  idSolicitud: number
): Promise<TaskListResponse> {
  return apiRequest<TaskListResponse>(
    `/sia/${idSolicitud}/tasks`
  );
}


/*
 * Crear tarea madre.
 */
export async function createSiaTask(
  idSolicitud: number,
  data: CreateTaskRequest
): Promise<CreateTaskResponse> {
  return apiRequest<CreateTaskResponse>(
    `/sia/${idSolicitud}/tasks`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}


/*
 * Crear subtarea.
 */
export async function createSiaSubtask(
  idSolicitud: number,
  idTareaPadre: number,
  data: CreateSubtaskRequest
): Promise<CreateSubtaskResponse> {
  return apiRequest<CreateSubtaskResponse>(
    `/sia/${idSolicitud}/tasks/${idTareaPadre}/subtasks`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}


/*
 * Cambiar estado de una tarea
 * o subtarea.
 */
export async function changeSiaTaskStatus(
  idSolicitud: number,
  idTarea: number,
  data: ChangeTaskStatusRequest
): Promise<ChangeTaskStatusResponse> {
  return apiRequest<ChangeTaskStatusResponse>(
    `/sia/${idSolicitud}/tasks/${idTarea}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}