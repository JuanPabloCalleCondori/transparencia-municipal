import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getSiaRequestById,
} from "../../api/sia.api";

import type {
  SiaRequest,
} from "../../types/sia";

import {
  formatDate,
  getDeadlineStatus,
} from "../../utils/deadline";


function formatState(
  state?: string | null
) {
  if (!state) {
    return "Sin estado";
  }

  return state.replaceAll(
    "_",
    " "
  );
}


export default function SiaDetailPage() {
  const navigate =
    useNavigate();

  const { id } =
    useParams();

  const [
    request,
    setRequest,
  ] = useState<SiaRequest | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function loadRequest() {
      try {
        setLoading(true);
        setError("");

        const numericId =
          Number(id);

        if (
          !Number.isInteger(
            numericId
          ) ||
          numericId <= 0
        ) {
          throw new Error(
            "ID de solicitud inválido"
          );
        }

        const response =
          await getSiaRequestById(
            numericId
          );

        setRequest(
          response.solicitud
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No fue posible cargar la solicitud."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRequest();
  }, [id]);


  if (loading) {
    return (
      <section>
        <div className="content-card">
          <div className="table-message">
            Cargando solicitud...
          </div>
        </div>
      </section>
    );
  }


  if (
    error ||
    !request
  ) {
    return (
      <section>
        <div className="page-heading">
          <div>
            <h1>
              Solicitud SIA
            </h1>
          </div>
        </div>

        <div className="table-error">
          <strong>
            No fue posible cargar la
            solicitud.
          </strong>

          <span>
            {error ||
              "Solicitud no encontrada."}
          </span>

          <button
            type="button"
            onClick={() =>
              navigate("/sia")
            }
          >
            Volver a solicitudes
          </button>
        </div>
      </section>
    );
  }


  const closed =
    [
      "FINALIZADA",
      "CANCELADA",
    ].includes(
      request.estado ?? ""
    );

  const deadline =
    request.fecha_vencimiento
      ? getDeadlineStatus(
          request.fecha_vencimiento
        )
      : null;

  const responsible =
    request.responsable?.trim()
      ? request.responsable
      : "Sin responsable";

  const department =
    request.departamento?.trim()
      ? request.departamento
      : "Sin asignar";

  const stateClass =
    (
      request.estado ??
      "desconocido"
    ).toLowerCase();


  return (
    <section>
      <div className="page-heading">
        <div>
          <button
            type="button"
            className="back-link"
            onClick={() =>
              navigate("/sia")
            }
          >
            ← Volver a solicitudes
          </button>

          <div className="sia-detail-title">
            <div>
              <h1>
                {request.folio}
              </h1>

              <p>
                Detalle y seguimiento
                de la solicitud de
                información.
              </p>
            </div>

            <span
              className={`state-badge state-${stateClass}`}
            >
              {formatState(
                request.estado
              )}
            </span>
          </div>
        </div>
      </div>


      <div className="sia-detail-grid">
        <div className="sia-detail-main">

          <div className="content-card">
            <div className="detail-section-title">
              <h2>
                Información de la solicitud
              </h2>
            </div>

            <div className="detail-data-grid">
              <div className="detail-field">
                <span>
                  Solicitante
                </span>

                <strong>
                  {request.nombre_solicitante ??
                    "Sin nombre"}
                </strong>
              </div>

              <div className="detail-field">
                <span>
                  Correo electrónico
                </span>

                <strong>
                  {request.email_solicitante ??
                    "Sin correo"}
                </strong>
              </div>

              <div className="detail-field">
                <span>
                  Fecha de ingreso
                </span>

                <strong>
                  {formatDate(
                    request.fecha_ingreso
                  )}
                </strong>
              </div>

              <div className="detail-field">
                <span>
                  Fecha de vencimiento
                </span>

                <strong>
                  {formatDate(
                    request.fecha_vencimiento
                  )}
                </strong>
              </div>
            </div>


            <div className="detail-description">
              <span>
                Información solicitada
              </span>

              <p>
                {request.descripcion}
              </p>
            </div>
          </div>


          <div className="content-card">
            <div className="detail-section-title">
              <h2>
                Gestión interna
              </h2>
            </div>

            <div className="detail-data-grid">
              <div className="detail-field">
                <span>
                  Departamento responsable
                </span>

                <strong>
                  {department}
                </strong>
              </div>

              <div className="detail-field">
                <span>
                  Funcionario responsable
                </span>

                <strong>
                  {responsible}
                </strong>
              </div>

              <div className="detail-field">
                <span>
                  Estado
                </span>

                <strong>
                  {formatState(
                    request.estado
                  )}
                </strong>
              </div>

              <div className="detail-field">
                <span>
                  Prórroga
                </span>

                <strong>
                  {request.tiene_prorroga
                    ? "Aplicada"
                    : "No aplicada"}
                </strong>
              </div>
            </div>
          </div>
        </div>


        <aside className="sia-detail-sidebar">
          <div className="content-card deadline-card">
            <span className="deadline-card-label">
              Estado del plazo
            </span>

            {closed ? (
              <>
                <strong className="deadline-card-title">
                  Solicitud cerrada
                </strong>

                <p>
                  Esta solicitud ya no
                  se encuentra en
                  tramitación.
                </p>
              </>
            ) : deadline ? (
              <>
                <div className="deadline-status">
                  <span
                    className={`traffic-light traffic-large ${
                      deadline.overdue
                        ? "traffic-overdue"
                        : `traffic-${deadline.trafficLight.toLowerCase()}`
                    }`}
                  />

                  <strong>
                    {deadline.overdue
                      ? "Vencida"
                      : deadline.trafficLight}
                  </strong>
                </div>

                <div className="deadline-number">
                  {deadline.overdue
                    ? Math.abs(
                        deadline.daysRemaining
                      )
                    : deadline.daysRemaining}
                </div>

                <span className="deadline-unit">
                  {deadline.overdue
                    ? "días hábiles de atraso"
                    : "días hábiles restantes"}
                </span>

                <div className="deadline-date">
                  Vence el{" "}
                  <strong>
                    {formatDate(
                      request.fecha_vencimiento
                    )}
                  </strong>
                </div>
              </>
            ) : (
              <p>
                La solicitud no tiene
                una fecha de vencimiento
                configurada.
              </p>
            )}
          </div>


          <div className="content-card detail-status-card">
            <span>
              Folio
            </span>

            <strong>
              {request.folio}
            </strong>

            <span>
              ID interno
            </span>

            <strong>
              #{request.id_solicitud}
            </strong>
          </div>
        </aside>
      </div>
    </section>
  );
}
