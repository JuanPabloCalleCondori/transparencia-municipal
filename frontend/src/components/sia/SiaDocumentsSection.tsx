import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  deleteSiaDocument,
  downloadSiaDocument,
  getSiaDocuments,
  uploadSiaDocument,
} from "../../api/document.api";

import type {
  SiaDocument,
} from "../../types/document";

import "./SiaDocumentsSection.css";


interface Props {
  idSolicitud: number;
  closed?: boolean;

  /*
   * ADMINISTRADOR_MUNICIPAL,
   * ENLACE_MUNICIPAL y
   * DIRECTOR_AREA pueden eliminar.
   *
   * Lo conectaremos definitivamente
   * con AuthContext cuando hagamos
   * el ajuste general de permisos.
   */
  canDelete?: boolean;
}


function formatDateTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}


function formatBytes(
  bytes: number
) {
  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const exponent =
    Math.min(
      Math.floor(
        Math.log(bytes) /
          Math.log(1024)
      ),
      units.length - 1
    );

  const value =
    bytes /
    Math.pow(
      1024,
      exponent
    );

  return `${value.toFixed(
    exponent === 0
      ? 0
      : 1
  )} ${units[exponent]}`;
}


function formatRole(
  role: string
) {
  return role.replaceAll(
    "_",
    " "
  );
}


function getFileExtension(
  fileName: string
) {
  const parts =
    fileName.split(".");

  if (
    parts.length <= 1
  ) {
    return "DOC";
  }

  return (
    parts
      .pop()
      ?.toUpperCase() ??
    "DOC"
  );
}


export default function SiaDocumentsSection({
  idSolicitud,
  closed = false,
  canDelete = false,
}: Props) {

  const [
    documents,
    setDocuments,
  ] = useState<SiaDocument[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null
  );

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    downloadingId,
    setDownloadingId,
  ] = useState<number | null>(
    null
  );

  const [
    deletingId,
    setDeletingId,
  ] = useState<number | null>(
    null
  );

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );


  const loadDocuments =
    useCallback(
      async (
        showLoading = true
      ) => {
        try {
          if (showLoading) {
            setLoading(true);
          }

          setError("");

          const response =
            await getSiaDocuments(
              idSolicitud
            );

          setDocuments(
            response.documentos
          );

        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar los documentos."
          );
        } finally {
          if (showLoading) {
            setLoading(false);
          }
        }
      },
      [idSolicitud]
    );


  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);


  function handleFileChange(
    event:
      React.ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setSuccessMessage("");

    const file =
      event.target.files?.[0];

    if (!file) {
      setSelectedFile(
        null
      );

      return;
    }

    setSelectedFile(
      file
    );
  }


  async function handleUpload(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!selectedFile) {
      setError(
        "Debes seleccionar un archivo."
      );

      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccessMessage("");

      const response =
        await uploadSiaDocument(
          idSolicitud,
          selectedFile
        );

      setSelectedFile(
        null
      );

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      await loadDocuments(
        false
      );

      setSuccessMessage(
        response.message ||
          "Documento adjuntado correctamente."
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible adjuntar el documento."
      );
    } finally {
      setUploading(false);
    }
  }


  async function handleDownload(
    document: SiaDocument
  ) {
    try {
      setError("");
      setSuccessMessage("");

      setDownloadingId(
        document.id_documento
      );

      await downloadSiaDocument(
        idSolicitud,
        document.id_documento,
        document.nombre_original
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible descargar el documento."
      );
    } finally {
      setDownloadingId(
        null
      );
    }
  }


  async function handleDelete(
    document: SiaDocument
  ) {
    const confirmed =
      window.confirm(
        `¿Deseas eliminar el documento "${document.nombre_original}"?`
      );

    if (!confirmed) {
      return;
    }


    try {
      setDeletingId(
        document.id_documento
      );

      setError("");
      setSuccessMessage("");

      const response =
        await deleteSiaDocument(
          idSolicitud,
          document.id_documento
        );

      await loadDocuments(
        false
      );

      setSuccessMessage(
        response.message ||
          "Documento eliminado correctamente."
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el documento."
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }


  return (
    <section className="sia-documents-section">

      <div className="sia-documents-header">
        <div>
          <h3>
            Documentos adjuntos
          </h3>

          <p>
            Antecedentes y archivos
            asociados a la solicitud.
          </p>
        </div>

        <div className="sia-documents-count">
          <strong>
            {documents.length}
          </strong>

          <span>
            {documents.length === 1
              ? "documento"
              : "documentos"}
          </span>
        </div>
      </div>


      {error && (
        <div className="sia-documents-feedback sia-documents-error">
          {error}
        </div>
      )}


      {successMessage && (
        <div className="sia-documents-feedback sia-documents-success">
          {successMessage}
        </div>
      )}


      {!closed && (
        <form
          className="sia-document-upload"
          onSubmit={
            handleUpload
          }
        >
          <div className="sia-document-upload-field">
            <label
              htmlFor="sia-document-file"
            >
              Adjuntar documento
            </label>

            <input
              ref={fileInputRef}
              id="sia-document-file"
              type="file"
              disabled={uploading}
              onChange={
                handleFileChange
              }
            />

            {selectedFile && (
              <div className="sia-selected-file">
                <strong>
                  {
                    selectedFile.name
                  }
                </strong>

                <span>
                  {formatBytes(
                    selectedFile.size
                  )}
                </span>
              </div>
            )}
          </div>


          <button
            type="submit"
            className="primary-button"
            disabled={
              uploading ||
              !selectedFile
            }
          >
            {uploading
              ? "Subiendo..."
              : "Adjuntar archivo"}
          </button>
        </form>
      )}


      {closed && (
        <div className="sia-documents-closed">
          La solicitud está cerrada.
          Los documentos permanecen
          disponibles en modo de
          consulta.
        </div>
      )}


      <div className="sia-documents-content">

        {loading && (
          <div className="sia-documents-message">
            Cargando documentos...
          </div>
        )}


        {!loading &&
          documents.length ===
            0 && (
            <div className="sia-documents-empty">
              <strong>
                Sin documentos adjuntos
              </strong>

              <span>
                Todavía no existen
                archivos asociados a
                esta solicitud.
              </span>
            </div>
          )}


        {!loading &&
          documents.length >
            0 && (
            <div className="sia-documents-list">

              {documents.map(
                (document) => (
                  <article
                    key={
                      document.id_documento
                    }
                    className="sia-document-card"
                  >

                    <div className="sia-document-icon">
                      {getFileExtension(
                        document.nombre_original
                      )}
                    </div>


                    <div className="sia-document-info">

                      <strong className="sia-document-name">
                        {
                          document.nombre_original
                        }
                      </strong>


                      <div className="sia-document-metadata">

                        <span>
                          {formatBytes(
                            document.tamano_bytes
                          )}
                        </span>

                        <span>
                          •
                        </span>

                        <span>
                          {
                            document.tipo_mime
                          }
                        </span>

                        <span>
                          •
                        </span>

                        <span>
                          {formatDateTime(
                            document.fecha_creacion
                          )}
                        </span>
                      </div>


                      <div className="sia-document-author">
                        Subido por{" "}
                        <strong>
                          {
                            document.nombre
                          }{" "}
                          {
                            document.apellido
                          }
                        </strong>

                        <span>
                          {" · "}
                          {formatRole(
                            document.rol
                          )}
                        </span>

                        {document.departamento && (
                          <span>
                            {" · "}
                            {
                              document.departamento
                            }
                          </span>
                        )}
                      </div>
                    </div>


                    <div className="sia-document-actions">

                      <button
                        type="button"
                        className="secondary-button"
                        disabled={
                          downloadingId ===
                          document.id_documento
                        }
                        onClick={() =>
                          handleDownload(
                            document
                          )
                        }
                      >
                        {downloadingId ===
                        document.id_documento
                          ? "Descargando..."
                          : "Descargar"}
                      </button>


                      {canDelete &&
                        !closed && (
                          <button
                            type="button"
                            className="sia-document-delete-button"
                            disabled={
                              deletingId ===
                              document.id_documento
                            }
                            onClick={() =>
                              handleDelete(
                                document
                              )
                            }
                          >
                            {deletingId ===
                            document.id_documento
                              ? "Eliminando..."
                              : "Eliminar"}
                          </button>
                        )}
                    </div>

                  </article>
                )
              )}

            </div>
          )}
      </div>

    </section>
  );
}
