import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getSiaRequests,
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


export default function SiaListPage() {
  const navigate =
    useNavigate();

  const [
    requests,
    setRequests,
  ] = useState<SiaRequest[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    stateFilter,
    setStateFilter,
  ] = useState("");


  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getSiaRequests();

      setRequests(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar las solicitudes"
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadRequests();
  }, []);


  const states =
    useMemo(() => {
      return Array.from(
        new Set(
          requests
            .map(
              (request) =>
                request.estado
            )
            .filter(
              (
                state
              ): state is string =>
                Boolean(state)
            )
        )
      );
    }, [requests]);


  const filteredRequests =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return requests.filter(
        (request) => {
          const folio =
            (
              request.folio ??
              ""
            ).toLowerCase();

          const applicant =
            (
              request.nombre_solicitante ??
              ""
            ).toLowerCase();

          const email =
            (
              request.email_solicitante ??
              ""
            ).toLowerCase();

          const matchesSearch =
            !term ||
            folio.includes(term) ||
            applicant.includes(
              term
            ) ||
            email.includes(
              term
            );

          const matchesState =
            !stateFilter ||
            request.estado ===
              stateFilter;

          return (
            matchesSearch &&
            matchesState
          );
        }
      );
    }, [
      requests,
      search,
      stateFilter,
    ]);


  const openRequests =
    useMemo(() => {
      return requests.filter(
        (request) =>
          ![
            "FINALIZADA",
            "CANCELADA",
          ].includes(
            request.estado ?? ""
          )
      ).length;
    }, [requests]);


  const overdueRequests =
    useMemo(() => {
      return requests.filter(
        (request) => {
          const closed =
            [
              "FINALIZADA",
              "CANCELADA",
            ].includes(
              request.estado ?? ""
            );

          if (
            closed ||
            !request.fecha_vencimiento
          ) {
            return false;
          }

          return getDeadlineStatus(
            request.fecha_vencimiento
          ).overdue;
        }
      ).length;
    }, [requests]);


  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>
            Solicitudes SIA
          </h1>

          <p>
            Gestión y seguimiento de
            solicitudes de acceso a la
            información.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate(
              "/sia/new"
            )
          }
        >
          Nueva solicitud
        </button>
      </div>


      <div className="sia-summary">
        <div>
          <span>
            Total
          </span>

          <strong>
            {requests.length}
          </strong>
        </div>

        <div>
          <span>
            Abiertas
          </span>

          <strong>
            {openRequests}
          </strong>
        </div>

        <div>
          <span>
            Vencidas
          </span>

          <strong>
            {overdueRequests}
          </strong>
        </div>
      </div>


      <div className="content-card">
        <div className="table-toolbar">
          <div className="table-search">
            <label htmlFor="sia-search">
              Buscar solicitud
            </label>

            <input
              id="sia-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Folio, solicitante o correo..."
            />
          </div>

          <div className="table-filter">
            <label htmlFor="sia-state">
              Estado
            </label>

            <select
              id="sia-state"
              value={stateFilter}
              onChange={(event) =>
                setStateFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                Todos
              </option>

              {states.map(
                (state) => (
                  <option
                    key={state}
                    value={state}
                  >
                    {formatState(
                      state
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          <button
            type="button"
            className="secondary-button table-refresh"
            onClick={
              loadRequests
            }
          >
            Actualizar
          </button>
        </div>


        {loading && (
          <div className="table-message">
            Cargando solicitudes...
          </div>
        )}


        {!loading && error && (
          <div className="table-error">
            <strong>
              No fue posible cargar las
              solicitudes.
            </strong>

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={
                loadRequests
              }
            >
              Reintentar
            </button>
          </div>
        )}


        {!loading &&
          !error &&
          filteredRequests.length ===
            0 && (
            <div className="table-message">
              No se encontraron
              solicitudes.
            </div>
          )}


        {!loading &&
          !error &&
          filteredRequests.length >
            0 && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>
                      Solicitante
                    </th>
                    <th>Estado</th>
                    <th>
                      Departamento
                    </th>
                    <th>
                      Vencimiento
                    </th>
                    <th>Plazo</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map(
                    (request) => {
                      const closed =
                        [
                          "FINALIZADA",
                          "CANCELADA",
                        ].includes(
                          request.estado ??
                            ""
                        );

                      const hasDeadline =
                        Boolean(
                          request.fecha_vencimiento
                        );

                      const deadline =
                        hasDeadline
                          ? getDeadlineStatus(
                              request.fecha_vencimiento
                            )
                          : null;

                      const stateClass =
                        (
                          request.estado ??
                          "desconocido"
                        )
                          .toLowerCase()
                          .replaceAll(
                            " ",
                            "_"
                          );

                      return (
                        <tr
                          key={
                            request.id_solicitud
                          }
                        >
                          <td>
                            <strong className="table-folio">
                              {request.folio ??
                                "Sin folio"}
                            </strong>
                          </td>

                          <td>
                            <div className="table-person">
                              <strong>
                                {request.nombre_solicitante ??
                                  "Sin nombre"}
                              </strong>

                              <span>
                                {request.email_solicitante ??
                                  "Sin correo"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`state-badge state-${stateClass}`}
                            >
                              {formatState(
                                request.estado
                              )}
                            </span>
                          </td>

                          <td>
                            {request.departamento ??
                              "Sin asignar"}
                          </td>

                          <td>
                            {hasDeadline
                              ? formatDate(
                                  request.fecha_vencimiento
                                )
                              : "Sin fecha"}
                          </td>

                          <td>
                            {closed ? (
                              <span className="deadline-closed">
                                Cerrada
                              </span>
                            ) : !deadline ? (
                              <span className="deadline-closed">
                                Sin plazo
                              </span>
                            ) : (
                              <div className="deadline-cell">
                                <span
                                  className={`traffic-light ${
                                    deadline.overdue
                                      ? "traffic-overdue"
                                      : `traffic-${deadline.trafficLight.toLowerCase()}`
                                  }`}
                                />

                                <span>
                                  {deadline.overdue
                                    ? `Vencida ${Math.abs(
                                        deadline.daysRemaining
                                      )} día(s)`
                                    : `${deadline.daysRemaining} día(s)`}
                                </span>
                              </div>
                            )}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="table-action"
                              onClick={() =>
                                navigate(
                                  `/sia/${request.id_solicitud}`
                                )
                              }
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </section>
  );
}
