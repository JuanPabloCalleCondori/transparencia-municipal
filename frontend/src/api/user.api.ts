import {
  apiRequest,
} from "./api";

import type {
  CreateUserData,
  UpdateUserData,
  UserListResponse,
  UserMutationResponse,
  UserOptionsResponse,
} from "../types/user";


export async function getUsers() {
  const response =
    await apiRequest<UserListResponse>(
      "/users"
    );

  return response.usuarios;
}


export async function getUserOptions() {
  return apiRequest<UserOptionsResponse>(
    "/users/options"
  );
}


export async function createUser(
  data: CreateUserData
) {
  return apiRequest<UserMutationResponse>(
    "/users",
    {
      method: "POST",

      body: JSON.stringify(
        data
      ),
    }
  );
}


export async function updateUser(
  idUsuario: number,
  data: UpdateUserData
) {
  return apiRequest<UserMutationResponse>(
    `/users/${idUsuario}`,
    {
      method: "PATCH",

      body: JSON.stringify(
        data
      ),
    }
  );
}


export async function deactivateUser(
  idUsuario: number
) {
  return apiRequest<UserMutationResponse>(
    `/users/${idUsuario}/deactivate`,
    {
      method: "PATCH",
    }
  );
}
