import {
  apiRequest,
} from "./api";

import type {
  CreateTransparencyItemData,
  CreateTransparencyLoadData,
  TransparencyAssignmentOptionsResponse,
  TransparencyItemResponse,
  TransparencyItemsResponse,
  TransparencyLoadResponse,
  TransparencyLoadsResponse,
  ValidateTransparencyLoadData,
} from "../types/transparency";


const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000/api";


export function getTransparencyItems() {
  return apiRequest<TransparencyItemsResponse>(
    "/transparency/items"
  );
}


export function getTransparencyItem(
  idItem: number
) {
  return apiRequest<TransparencyItemResponse>(
    `/transparency/items/${idItem}`
  );
}


export function createTransparencyItem(
  data: CreateTransparencyItemData
) {
  return apiRequest<TransparencyItemResponse>(
    "/transparency/items",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}


export function getTransparencyLoads(
  periodo?: string
) {
  const query =
    periodo
      ? `?periodo=${encodeURIComponent(
          periodo
        )}`
      : "";

  return apiRequest<TransparencyLoadsResponse>(
    `/transparency/loads${query}`
  );
}


export function getTransparencyLoad(
  idCarga: number
) {
  return apiRequest<TransparencyLoadResponse>(
    `/transparency/loads/${idCarga}`
  );
}


export function createTransparencyLoad(
  data: CreateTransparencyLoadData
) {
  return apiRequest<TransparencyLoadResponse>(
    "/transparency/loads",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}


export async function uploadTransparencyFile(
  idCarga: number,
  file: File
) {
  const formData =
    new FormData();

  formData.append(
    "archivo",
    file
  );

  return apiRequest<TransparencyLoadResponse>(
    `/transparency/loads/${idCarga}/file`,
    {
      method: "POST",
      body: formData,
    }
  );
}


export function validateTransparencyLoad(
  idCarga: number,
  data: ValidateTransparencyLoadData
) {
  return apiRequest<TransparencyLoadResponse>(
    `/transparency/loads/${idCarga}/validate`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}


export function publishTransparencyLoad(
  idCarga: number
) {
  return apiRequest<TransparencyLoadResponse>(
    `/transparency/loads/${idCarga}/publish`,
    {
      method: "PATCH",
    }
  );
}


/*
 * Esta función queda preparada para cuando
 * incorporemos descarga directa del archivo.
 */
export function getTransparencyFileUrl(
  path: string
) {
  return `${API_URL}/${path}`;
}

export function getTransparencyAssignmentOptions() {
  return apiRequest<TransparencyAssignmentOptionsResponse>(
    "/transparency/assignment-options"
  );
}

export async function downloadTransparencyFile(
  idCarga: number,
  fileName: string
) {
  const token =
    localStorage.getItem(
      "token"
    );

  if (!token) {
    throw new Error(
      "No existe una sesión activa."
    );
  }


  const API_URL =
    import.meta.env
      .VITE_API_URL;


  const response =
    await fetch(
      `${API_URL}/transparency/loads/${idCarga}/file`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


  if (!response.ok) {
    let message =
      "No fue posible descargar el archivo.";

    try {
      const data =
        await response.json();

      if (data.message) {
        message =
          data.message;
      }
    } catch {
      // La respuesta puede no ser JSON.
    }

    throw new Error(
      message
    );
  }


  const blob =
    await response.blob();


  const url =
    window.URL.createObjectURL(
      blob
    );


  const anchor =
    document.createElement(
      "a"
    );

  anchor.href =
    url;

  anchor.download =
    fileName;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  window.URL.revokeObjectURL(
    url
  );
}
