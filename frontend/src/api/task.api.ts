import {
  apiRequest,
} from "./api";

import type {
  AssignTaskRequest,
  AssignTaskResponse,
  ChangeTaskStatusRequest,
  ChangeTaskStatusResponse,
  CreateSubtaskRequest,
  CreateSubtaskResponse,
  CreateTaskRequest,
  CreateTaskResponse,
  TaskListResponse,
} from "../types/task";


export async function getSiaTasks(
  idSolicitud: number
) {
  return apiRequest<TaskListResponse>(
    `/sia/${idSolicitud}/tasks`
  );
}


export async function createSiaTask(
  idSolicitud: number,
  data: CreateTaskRequest
) {
  return apiRequest<CreateTaskResponse>(
    `/sia/${idSolicitud}/tasks`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}


export async function createSiaSubtask(
  idSolicitud: number,
  idTareaPadre: number,
  data: CreateSubtaskRequest
) {
  return apiRequest<CreateSubtaskResponse>(
    `/sia/${idSolicitud}/tasks/${idTareaPadre}/subtasks`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}


export async function changeSiaTaskStatus(
  idSolicitud: number,
  idTarea: number,
  data: ChangeTaskStatusRequest
) {
  return apiRequest<ChangeTaskStatusResponse>(
    `/sia/${idSolicitud}/tasks/${idTarea}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}


export async function assignSiaTask(
  idSolicitud: number,
  idTarea: number,
  data: AssignTaskRequest
) {
  return apiRequest<AssignTaskResponse>(
    `/sia/${idSolicitud}/tasks/${idTarea}/assign`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}
