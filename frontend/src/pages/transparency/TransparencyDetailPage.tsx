import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  downloadTransparencyFile,
  getTransparencyLoad,
  publishTransparencyLoad,
  uploadTransparencyFile,
  validateTransparencyLoad,
} from "../../api/transparency.api";

import type {
  TransparencyLoad,
  TransparencyStatus,
} from "../../types/transparency";

import "./TransparencyDetailPage.css";


function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "—";
  }

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


function formatPeriod(
  value: string
) {
  const parts =
    value
      .slice(0, 10)
      .split("-");

  if (parts.length < 2) {
    return value;
  }

  const year =
    Number(parts[0]);

  const month =
    Number(parts[1]);

  const date =
    new Date(
      year,
      month - 1,
      1
    );

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      month: "long",
      year: "numeric",
    }
  ).format(date);
}


function statusLabel(
  status: TransparencyStatus
) {
  const labels:
    Record<
      TransparencyStatus,
      string
    > = {
      PENDIENTE:
        "Pendiente",

      EN_REVISION:
        "En revisión",

      APROBADO:
        "Aprobado",

      RECHAZADO:
        "Rechazado",

      PUBLICADO:
        "Publicado",
    };

  return labels[status];
}


export default function TransparencyDetailPage() {

  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();

  const idCarga =
    Number(id);

  const [
    load,
    setLoad,
  ] = useState<
    TransparencyLoad | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    actionMessage,
    setActionMessage,
  ] = useState("");

  const [
    actionError,
    setActionError,
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
    decision,
    setDecision,
  ] = useState<
    "APROBADO" |
    "RECHAZADO" |
    ""
  >("");

  const [
    observation,
    setObservation,
  ] = useState("");

  const [
    validating,
    setValidating,
  ] = useState(false);

  const [
    publishing,
    setPublishing,
  ] = useState(false);

  const [
  downloading,
  setDownloading,
] = useState(false);


  const loadDetail =
    useCallback(
      async () => {
        if (
          !Number.isInteger(idCarga) ||
          idCarga <= 0
        ) {
          setError(
            "ID de carga inválido."
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await getTransparencyLoad(
              idCarga
            );

          setLoad(
            response.carga
          );

        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar el detalle."
          );
        } finally {
          setLoading(false);
        }
      },
      [idCarga]
    );


  useEffect(() => {
    loadDetail();
  }, [loadDetail]);


  async function handleUpload(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setActionMessage("");
    setActionError("");

    if (!selectedFile) {
      setActionError(
        "Debes seleccionar un archivo."
      );

      return;
    }

    try {
      setUploading(true);

      await uploadTransparencyFile(
        idCarga,
        selectedFile
      );

      setSelectedFile(null);

      setActionMessage(
        "Archivo cargado correctamente y enviado a revisión."
      );

      await loadDetail();

    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar el archivo."
      );
    } finally {
      setUploading(false);
    }
  }


  async function handleValidation(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setActionMessage("");
    setActionError("");

    if (!decision) {
      setActionError(
        "Debes seleccionar una decisión."
      );

      return;
    }

    if (
      decision ===
        "RECHAZADO" &&
      !observation.trim()
    ) {
      setActionError(
        "Debes ingresar una observación para rechazar la carga."
      );

      return;
    }

    try {
      setValidating(true);

      await validateTransparencyLoad(
        idCarga,
        {
          decision,
          observacion:
            observation.trim() ||
            undefined,
        }
      );

      setDecision("");
      setObservation("");

      setActionMessage(
        decision === "APROBADO"
          ? "Carga aprobada correctamente."
          : "Carga rechazada correctamente."
      );

      await loadDetail();

    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No fue posible validar la carga."
      );
    } finally {
      setValidating(false);
    }
  }


  async function handlePublish() {
    setActionMessage("");
    setActionError("");

    const confirmed =
      window.confirm(
        "¿Deseas publicar esta carga de Transparencia Activa?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setPublishing(true);

      await publishTransparencyLoad(
        idCarga
      );

      setActionMessage(
        "Carga publicada correctamente."
      );

      await loadDetail();

    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No fue posible publicar la carga."
      );
    } finally {
      setPublishing(false);
    }
  }

  async function handleDownload() {
  if (
    !load ||
    !load.nombre_archivo
  ) {
    return;
  }

  setActionMessage("");
  setActionError("");

  try {
    setDownloading(true);

    await downloadTransparencyFile(
      load.id_carga,
      load.nombre_archivo
    );

  } catch (error) {
    setActionError(
      error instanceof Error
        ? error.message
        : "No fue posible descargar el archivo."
    );
  } finally {
    setDownloading(false);
  }
}


  if (loading) {
    return (
      <div className="transparency-detail-message">
        Cargando detalle...
      </div>
    );
  }


  if (
    error ||
    !load
  ) {
    return (
      <div className="transparency-detail-page">

        <button
          type="button"
          className="transparency-detail-back"
          onClick={() =>
            navigate(
              "/transparency"
            )
          }
        >
          ← Volver a Transparencia Activa
        </button>

        <div className="transparency-detail-error">
          {error ||
            "Carga no encontrada."}
        </div>

      </div>
    );
  }
  return (
    <div className="transparency-detail-page">

      <div className="transparency-detail-topbar">

        <button
          type="button"
          className="transparency-detail-back"
          onClick={() =>
            navigate(
              "/transparency"
            )
          }
        >
          ← Volver
        </button>

      </div>


      <div className="transparency-detail-header">

        <div>
          <span className="transparency-detail-eyebrow">
            Transparencia Activa
          </span>

          <h1>
            {load.item}
          </h1>

          <p>
            Gestión del período{" "}
            {formatPeriod(
              load.periodo
            )}
          </p>
        </div>


        <span
          className={
            `transparency-detail-status transparency-detail-status-${load.estado.toLowerCase()}`
          }
        >
          {statusLabel(
            load.estado
          )}
        </span>

      </div>


      {actionMessage && (
        <div className="transparency-detail-success">
          {actionMessage}
        </div>
      )}


      {actionError && (
        <div className="transparency-detail-error">
          {actionError}
        </div>
      )}


      <section className="transparency-detail-card">

        <div className="transparency-detail-card-header">
          <h2>
            Información general
          </h2>
        </div>


        <div className="transparency-detail-grid">

          <div className="transparency-detail-field">
            <span>
              Ítem
            </span>

            <strong>
              {load.item}
            </strong>
          </div>


          <div className="transparency-detail-field">
            <span>
              Período
            </span>

            <strong>
              {formatPeriod(
                load.periodo
              )}
            </strong>
          </div>


          <div className="transparency-detail-field">
            <span>
              Departamento
            </span>

            <strong>
              {load.departamento}
            </strong>
          </div>


          <div className="transparency-detail-field">
            <span>
              Responsable
            </span>

            <strong>
              {load.responsable}
            </strong>
          </div>


          <div className="transparency-detail-field">
            <span>
              Validador
            </span>

            <strong>
              {load.validador ||
                "Aún no asignado"}
            </strong>
          </div>


          <div className="transparency-detail-field">
            <span>
              Creación
            </span>

            <strong>
              {formatDateTime(
                load.fecha_creacion
              )}
            </strong>
          </div>

        </div>

      </section>


      <section className="transparency-detail-card">

        <div className="transparency-detail-card-header">

          <div>
            <h2>
              Documento mensual
            </h2>

            <p>
              Archivo asociado a esta
              carga de Transparencia
              Activa.
            </p>
          </div>

        </div>

        {load.nombre_archivo ? (
  <div className="transparency-file-current">

    <div>
      <span>
        Archivo actual
      </span>

      <strong>
        {load.nombre_archivo}
      </strong>
    </div>


    <div>
      <span>
        Fecha de carga
      </span>

      <strong>
        {formatDateTime(
          load.fecha_carga
        )}
      </strong>
    </div>


    <div className="transparency-file-actions">

      <button
        type="button"
        className="transparency-download-button"
        onClick={
          handleDownload
        }
        disabled={
          downloading
        }
      >
        {downloading
          ? "Descargando..."
          : "Descargar archivo"}
      </button>

    </div>

  </div>
) : (
        
          <div className="transparency-detail-empty">
            Todavía no existe un archivo
            asociado.
          </div>
        )}


        {load.estado !==
          "PUBLICADO" && (
          <form
            className="transparency-upload-form"
            onSubmit={
              handleUpload
            }
          >

            <label
              htmlFor="transparency-file"
              className="transparency-file-label"
            >
              Seleccionar archivo
            </label>

            <input
              id="transparency-file"
              type="file"
              onChange={(event) =>
                setSelectedFile(
                  event.target.files?.[0] ??
                    null
                )
              }
              disabled={
                uploading
              }
            />


            {selectedFile && (
              <div className="transparency-selected-file">
                <strong>
                  Archivo seleccionado:
                </strong>{" "}
                {selectedFile.name}
              </div>
            )}


            <button
              type="submit"
              className="transparency-detail-primary"
              disabled={
                uploading ||
                !selectedFile
              }
            >
              {uploading
                ? "Subiendo..."
                : load.nombre_archivo
                  ? "Reemplazar archivo y enviar a revisión"
                  : "Subir archivo y enviar a revisión"}
            </button>

          </form>
        )}

      </section>


      {load.estado ===
        "EN_REVISION" && (
        <section className="transparency-detail-card">

          <div className="transparency-detail-card-header">

            <div>
              <h2>
                Validación
              </h2>

              <p>
                Revisa la documentación
                cargada antes de aprobar
                o rechazar.
              </p>
            </div>

          </div>


          <form
            className="transparency-validation-form"
            onSubmit={
              handleValidation
            }
          >

            <div className="transparency-validation-options">

              <label>
                <input
                  type="radio"
                  name="decision"
                  value="APROBADO"
                  checked={
                    decision ===
                    "APROBADO"
                  }
                  onChange={() =>
                    setDecision(
                      "APROBADO"
                    )
                  }
                />

                Aprobar carga
              </label>


              <label>
                <input
                  type="radio"
                  name="decision"
                  value="RECHAZADO"
                  checked={
                    decision ===
                    "RECHAZADO"
                  }
                  onChange={() =>
                    setDecision(
                      "RECHAZADO"
                    )
                  }
                />

                Rechazar carga
              </label>

            </div>


            {decision ===
              "RECHAZADO" && (
              <div className="transparency-validation-observation">

                <label htmlFor="observation">
                  Observación del rechazo
                </label>

                <textarea
                  id="observation"
                  rows={4}
                  value={
                    observation
                  }
                  onChange={(event) =>
                    setObservation(
                      event.target.value
                    )
                  }
                  placeholder="Indica qué debe corregirse antes de volver a revisar la información."
                />

              </div>
            )}


            <div className="transparency-validation-actions">

              <button
                type="submit"
                className="transparency-detail-primary"
                disabled={
                  validating ||
                  !decision
                }
              >
                {validating
                  ? "Procesando..."
                  : decision ===
                      "RECHAZADO"
                    ? "Confirmar rechazo"
                    : "Confirmar aprobación"}
              </button>

            </div>

          </form>

        </section>
      )}


      {load.estado ===
        "RECHAZADO" && (
        <section className="transparency-detail-card transparency-rejected-card">

          <div className="transparency-detail-card-header">

            <div>
              <h2>
                Corrección requerida
              </h2>

              <p>
                La carga fue rechazada y
                debe corregirse antes de
                volver a revisión.
              </p>
            </div>

          </div>


          <div className="transparency-rejection-observation">

            <span>
              Observación
            </span>

            <p>
              {load.observacion ||
                "Sin observación registrada."}
            </p>

          </div>

        </section>
      )}


      {load.estado ===
        "APROBADO" && (
        <section className="transparency-detail-card transparency-approved-card">

          <div className="transparency-detail-card-header">

            <div>
              <h2>
                Publicación
              </h2>

              <p>
                La información fue
                validada y está preparada
                para su publicación.
              </p>
            </div>

          </div>


          <div className="transparency-publication-info">

            <div>
              <span>
                Fecha de validación
              </span>

              <strong>
                {formatDateTime(
                  load.fecha_validacion
                )}
              </strong>
            </div>


            <button
              type="button"
              className="transparency-detail-primary"
              onClick={
                handlePublish
              }
              disabled={
                publishing
              }
            >
              {publishing
                ? "Publicando..."
                : "Publicar información"}
            </button>

          </div>

        </section>
      )}


      {load.estado ===
        "PUBLICADO" && (
        <section className="transparency-detail-card transparency-published-card">

          <div className="transparency-publication-complete">

            <div className="transparency-publication-icon">
              ✓
            </div>

            <div>
              <h2>
                Información publicada
              </h2>

              <p>
                Esta carga completó el
                proceso de Transparencia
                Activa.
              </p>

              <span>
                Publicado el{" "}
                {formatDateTime(
                  load.fecha_publicacion
                )}
              </span>
            </div>

          </div>

        </section>
      )}

    </div>
  );
}
