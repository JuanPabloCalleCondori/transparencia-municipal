import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getSiaHistory,
} from "../../api/audit.api";

import type {
  AuditEntry,
} from "../../types/audit";

import "./SiaAuditSection.css";


interface Props {
  idSolicitud: number;
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
      second: "2-digit",
    }
  ).format(date);
}


function formatAction(
  action: string
) {
  const labels:
    Record<string, string> = {

      CREAR_SOLICITUD:
        "Solicitud creada",

      ASIGNAR_SOLICITUD:
        "Solicitud asignada",

      CAMBIAR_ESTADO:
        "Cambio de estado",

      APLICAR_PRORROGA:
        "Prórroga aplicada",

      CREAR_TAREA:
        "Tarea creada",

      CREAR_SUBTAREA:
        "Subtarea creada",

      CAMBIAR_ESTADO_TAREA:
        "Estado de tarea actualizado",

      ASIGNAR_TAREA:
        "Responsable de tarea asignado",

      REASIGNAR_TAREA:
        "Tarea reasignada",

      AGREGAR_COMENTARIO:
        "Comentario interno agregado",

      SUBIR_DOCUMENTO:
        "Documento adjuntado",

      ELIMINAR_DOCUMENTO:
        "Documento eliminado",
    };


  return (
    labels[action] ??
    action.replaceAll(
      "_",
      " "
    )
  );
}


function getInitials(
  entry: AuditEntry
) {
  const first =
    entry.usuario_nombre
      ?.trim()
      .charAt(0) ?? "";

  const last =
    entry.usuario_apellido
      ?.trim()
      .charAt(0) ?? "";

  const initials =
    `${first}${last}`
      .toUpperCase();

  return (
    initials ||
    "S"
  );
}


function getUserName(
  entry: AuditEntry
) {
  const fullName = [
    entry.usuario_nombre,
    entry.usuario_apellido,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();


  if (fullName) {
    return fullName;
  }


  /*
   * Un registro puede no tener
   * usuario asociado.
   */
  return "Sistema";
}


function formatValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  if (
    typeof value === "boolean"
  ) {
    return value
      ? "Sí"
      : "No";
  }

  if (
    typeof value === "object"
  ) {
    try {
      return JSON.stringify(
        value,
        null,
        2
      );
    } catch {
      return String(value);
    }
  }

  return String(value);
}


function formatFieldName(
  field: string
) {
  return field
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}


function AuditData({
  title,
  data,
}: {
  title: string;
  data:
    | Record<string, unknown>
    | null;
}) {

  if (
    !data ||
    Object.keys(data).length ===
      0
  ) {
    return null;
  }


  return (
    <div className="sia-audit-data">
      <strong className="sia-audit-data-title">
        {title}
      </strong>

      <div className="sia-audit-data-grid">

        {Object.entries(
          data
        ).map(
          ([
            field,
            value,
          ]) => (
            <div
              key={field}
              className="sia-audit-data-row"
            >
              <span>
                {formatFieldName(
                  field
                )}
              </span>

              <code>
                {formatValue(
                  value
                )}
              </code>
            </div>
          )
        )}

      </div>
    </div>
  );
}


export default function SiaAuditSection({
  idSolicitud,
}: Props) {

  const [
    history,
    setHistory,
  ] = useState<AuditEntry[]>(
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
    expandedId,
    setExpandedId,
  ] = useState<number | null>(
    null
  );


  const loadHistory =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getSiaHistory(
              idSolicitud
            );

          setHistory(
            response.historial
          );

        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar el historial."
          );
        } finally {
          setLoading(false);
        }
      },
      [idSolicitud]
    );


  useEffect(() => {
    loadHistory();
  }, [loadHistory]);


  function toggleDetails(
    idAudit: number
  ) {
    setExpandedId(
      (current) =>
        current === idAudit
          ? null
          : idAudit
    );
  }


  return (
    <section className="sia-audit-section">

      <div className="sia-audit-header">

        <div>
          <h3>
            Historial y trazabilidad
          </h3>

          <p>
            Registro cronológico de las
            acciones realizadas sobre
            esta solicitud.
          </p>
        </div>


        <div className="sia-audit-count">
          <strong>
            {history.length}
          </strong>

          <span>
            {history.length === 1
              ? "evento"
              : "eventos"}
          </span>
        </div>

      </div>


      {error && (
        <div className="sia-audit-error">
          {error}
        </div>
      )}


      {loading && (
        <div className="sia-audit-message">
          Cargando historial...
        </div>
      )}


      {!loading &&
        history.length ===
          0 && (
          <div className="sia-audit-empty">

            <strong>
              Sin registros
            </strong>

            <span>
              Todavía no existen eventos
              de auditoría asociados a
              esta solicitud.
            </span>

          </div>
        )}


      {!loading &&
        history.length >
          0 && (
          <div className="sia-audit-timeline">

            {history.map(
              (
                entry,
                index
              ) => {

                const hasDetails =
                  Boolean(
                    entry.datos_anteriores &&
                    Object.keys(
                      entry.datos_anteriores
                    ).length
                  ) ||
                  Boolean(
                    entry.datos_nuevos &&
                    Object.keys(
                      entry.datos_nuevos
                    ).length
                  );


                const expanded =
                  expandedId ===
                  entry.id_auditoria;


                return (
                  <article
                    key={
                      entry.id_auditoria
                    }
                    className="sia-audit-entry"
                  >

                    <div className="sia-audit-line-column">

                      <div className="sia-audit-avatar">
                        {getInitials(
                          entry
                        )}
                      </div>

                      {index <
                        history.length -
                          1 && (
                        <div className="sia-audit-line" />
                      )}

                    </div>


                    <div className="sia-audit-entry-content">

                      <div className="sia-audit-entry-heading">

                        <div>
                          <strong className="sia-audit-action">
                            {formatAction(
                              entry.accion
                            )}
                          </strong>

                          <span className="sia-audit-date">
                            {formatDateTime(
                              entry.fecha_hora
                            )}
                          </span>
                        </div>


                        <span className="sia-audit-user">
                          {getUserName(
                            entry
                          )}
                        </span>

                      </div>


                      {entry.descripcion && (
                        <p className="sia-audit-description">
                          {
                            entry.descripcion
                          }
                        </p>
                      )}


                      <div className="sia-audit-meta">

                        {entry.usuario_email && (
                          <span>
                            {
                              entry.usuario_email
                            }
                          </span>
                        )}


                        {entry.ip_origen && (
                          <span>
                            IP:{" "}
                            {
                              entry.ip_origen
                            }
                          </span>
                        )}

                      </div>


                      {hasDetails && (
                        <div className="sia-audit-details">

                          <button
                            type="button"
                            className="sia-audit-details-button"
                            onClick={() =>
                              toggleDetails(
                                entry.id_auditoria
                              )
                            }
                          >
                            {expanded
                              ? "Ocultar detalles"
                              : "Ver detalles técnicos"}
                          </button>


                          {expanded && (
                            <div className="sia-audit-details-content">

                              <AuditData
                                title="Datos anteriores"
                                data={
                                  entry.datos_anteriores
                                }
                              />

                              <AuditData
                                title="Datos nuevos"
                                data={
                                  entry.datos_nuevos
                                }
                              />

                            </div>
                          )}

                        </div>
                      )}

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

    </section>
  );
}
