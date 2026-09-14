import {
  apiRequest,
} from "./api";

import type {
  DeleteSiaDocumentResponse,
  SiaDocumentListResponse,
  UploadSiaDocumentResponse,
} from "../types/document";


const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000/api";


export async function getSiaDocuments(
  idSolicitud: number
) {
  return apiRequest<SiaDocumentListResponse>(
    `/sia/${idSolicitud}/documents`
  );
}


export async function uploadSiaDocument(
  idSolicitud: number,
  file: File
) {
  const formData =
    new FormData();

  /*
   * Debe llamarse "archivo"
   * porque multer espera:
   *
   * uploadSiaDocument.single("archivo")
   */
  formData.append(
    "archivo",
    file
  );

  return apiRequest<UploadSiaDocumentResponse>(
    `/sia/${idSolicitud}/documents`,
    {
      method: "POST",
      body: formData,
    }
  );
}


export async function deleteSiaDocument(
  idSolicitud: number,
  idDocumento: number
) {
  return apiRequest<DeleteSiaDocumentResponse>(
    `/sia/${idSolicitud}/documents/${idDocumento}`,
    {
      method: "DELETE",
    }
  );
}


export async function downloadSiaDocument(
  idSolicitud: number,
  idDocumento: number,
  fileName: string
) {
  /*
   * El endpoint de descarga también
   * está protegido por JWT, por eso
   * hacemos fetch manualmente.
   */
  const token =
    localStorage.getItem(
      "token"
    );

  if (!token) {
    throw new Error(
      "No se encontró una sesión activa."
    );
  }


  const response =
    await fetch(
      `${API_URL}/sia/${idSolicitud}/documents/${idDocumento}/download`,
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
      "No fue posible descargar el documento.";

    try {
      const data =
        await response.json();

      if (
        typeof data?.message ===
        "string"
      ) {
        message =
          data.message;
      }
    } catch {
      /*
       * La respuesta puede no ser JSON.
       */
    }

    throw new Error(
      message
    );
  }


  const blob =
    await response.blob();

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href =
    url;

  link.download =
    fileName;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );
}
