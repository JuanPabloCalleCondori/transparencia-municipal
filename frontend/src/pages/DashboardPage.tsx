import {
  useEffect,
  useState,
} from "react";

import {
  getDashboardSummary,
} from "../api/dashboard.api";

import type {
  DashboardSummary,
} from "../types/dashboard";


function formatNumber(
  value: number | undefined
) {
  return Number(
    value ?? 0
  ).toLocaleString("es-CL");
}


function formatPercentage(
  value: number | undefined
) {
  return `${Number(
    value ?? 0
  ).toFixed(1)}%`;
}


export default function DashboardPage() {
  const [
    dashboard,
    setDashboard,
  ] =
    useState<DashboardSummary | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getDashboardSummary();

      setDashboard(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar el panel de control"
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadDashboard();
  }, []);


  if (loading) {
    return (
      <div className="content-card">
        Cargando indicadores...
      </div>
    );
  }


  if (error) {
    return (
      <div className="dashboard-error">
        <strong>
          No fue posible cargar el
          panel de control
        </strong>

        <span>{error}</span>

        <button
          type="button"
          onClick={loadDashboard}
        >
          Reintentar
        </button>
      </div>
    );
  }


  if (!dashboard) {
    return null;
  }


  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>
            Panel de Control
          </h1>

          <p>
            Resumen general de
            Transparencia Activa y
            solicitudes SIA.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadDashboard}
        >
          Actualizar
        </button>
      </div>


      {/* =========================
          INDICADORES SIA
          ========================= */}

      <div className="section-heading">
        <div>
          <span className="section-label">
            SIA
          </span>

          <h2>
            Solicitudes de información
          </h2>
        </div>
      </div>


      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-card-header">
            <span>
              Solicitudes totales
            </span>

            <span className="stat-icon">
              SIA
            </span>
          </div>

          <strong className="stat-value">
            {formatNumber(
              dashboard.sia.totalSolicitudes
            )}
          </strong>

          <small>
            Solicitudes registradas
          </small>
        </article>


        <article className="stat-card">
          <div className="stat-card-header">
            <span>
              Pendientes
            </span>

            <span className="status-dot warning" />
          </div>

          <strong className="stat-value">
            {formatNumber(
              dashboard.sia.solicitudesPendientes
            )}
          </strong>

          <small>
            Solicitudes abiertas
          </small>
        </article>


        <article className="stat-card">
          <div className="stat-card-header">
            <span>
              Vencidas
            </span>

            <span className="status-dot danger" />
          </div>

          <strong className="stat-value">
            {formatNumber(
              dashboard.sia.solicitudesVencidas
            )}
          </strong>

          <small>
            Requieren atención
          </small>
        </article>


        <article className="stat-card">
          <div className="stat-card-header">
            <span>
              Cumplimiento
            </span>

            <span className="status-dot success" />
          </div>

          <strong className="stat-value">
            {formatPercentage(
              dashboard.sia.tasaCumplimiento
            )}
          </strong>

          <small>
            Dentro del plazo
          </small>
        </article>
      </div>


      {/* =========================
          INFORMACIÓN SECUNDARIA
          ========================= */}

      <div className="dashboard-grid">
        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>
                Solicitudes por estado
              </h3>

              <p>
                Distribución actual de
                solicitudes SIA.
              </p>
            </div>
          </div>

          {dashboard
            .solicitudesPorEstado
            .length === 0 ? (
            <p className="empty-message">
              No existen solicitudes
              registradas.
            </p>
          ) : (
            <div className="data-list">
              {dashboard
                .solicitudesPorEstado
                .map((item) => (
                  <div
                    className="data-list-row"
                    key={item.estado}
                  >
                    <span>
                      {item.estado.replaceAll(
                        "_",
                        " "
                      )}
                    </span>

                    <strong>
                      {formatNumber(
                        item.total
                      )}
                    </strong>
                  </div>
                ))}
            </div>
          )}
        </article>


        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>
                Solicitudes por departamento
              </h3>

              <p>
                Distribución según unidad
                responsable.
              </p>
            </div>
          </div>

          {dashboard
            .solicitudesPorDepartamento
            .length === 0 ? (
            <p className="empty-message">
              No existen departamentos
              asociados.
            </p>
          ) : (
            <div className="data-list">
              {dashboard
                .solicitudesPorDepartamento
                .map((item) => (
                  <div
                    className="data-list-row"
                    key={
                      item.departamento
                    }
                  >
                    <span>
                      {item.departamento}
                    </span>

                    <strong>
                      {formatNumber(
                        item.total
                      )}
                    </strong>
                  </div>
                ))}
            </div>
          )}
        </article>
      </div>


      {/* =========================
          TRANSPARENCIA ACTIVA
          ========================= */}

      <div className="section-heading section-spacing">
        <div>
          <span className="section-label">
            TRANSPARENCIA ACTIVA
          </span>

          <h2>
            Estado de publicaciones
          </h2>
        </div>
      </div>


      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-card-header">
            <span>
              Cargas totales
            </span>

            <span className="stat-icon">
              TA
            </span>
          </div>

          <strong className="stat-value">
            {formatNumber(
              dashboard.transparencia.totalCargas
            )}
          </strong>

          <small>
            Registros mensuales
          </small>
        </article>


        <article className="stat-card">
          <div className="stat-card-header">
            <span>
              Pendientes
            </span>

            <span className="status-dot warning" />
          </div>

          <strong className="stat-value">
            {formatNumber(
              dashboard.transparencia
                .pendientes
            )}
          </strong>

          <small>
            Pendientes de carga
          </small>
        </article>


        <article className="stat-card">
          <div className="stat-card-header">
            <span>
              En revisión
            </span>

            <span className="status-dot info" />
          </div>

          <strong className="stat-value">
            {formatNumber(
              dashboard.transparencia
                .enRevision
            )}
          </strong>

          <small>
            Esperando validación
          </small>
        </article>


        <article className="stat-card">
          <div className="stat-card-header">
            <span>
              Publicadas
            </span>

            <span className="status-dot success" />
          </div>

          <strong className="stat-value">
            {formatNumber(
              dashboard.transparencia
                .publicadas
            )}
          </strong>

          <small>
            Información publicada
          </small>
        </article>
      </div>


      <div className="dashboard-grid dashboard-bottom">
        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>
                Transparencia por estado
              </h3>

              <p>
                Situación actual de las
                cargas mensuales.
              </p>
            </div>
          </div>

          {dashboard
            .transparenciaPorEstado
            .length === 0 ? (
            <p className="empty-message">
              No existen cargas
              registradas.
            </p>
          ) : (
            <div className="data-list">
              {dashboard
                .transparenciaPorEstado
                .map((item) => (
                  <div
                    className="data-list-row"
                    key={item.estado}
                  >
                    <span>
                      {item.estado.replaceAll(
                        "_",
                        " "
                      )}
                    </span>

                    <strong>
                      {formatNumber(
                        item.total
                      )}
                    </strong>
                  </div>
                ))}
            </div>
          )}
        </article>


        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>
                Indicadores de gestión
              </h3>

              <p>
                Rendimiento general del
                proceso SIA.
              </p>
            </div>
          </div>

          <div className="management-indicators">
            <div>
              <span>
                Solicitudes finalizadas
              </span>

              <strong>
                {formatNumber(
                  dashboard.sia.solicitudesFinalizadas
                )}
              </strong>
            </div>

            <div>
              <span>
                Promedio de respuesta
              </span>

              <strong>
                {Number(
                  dashboard.sia.tiempoPromedioRespuesta ??
                    0
                ).toFixed(1)}{" "}
                días
              </strong>
            </div>

            <div>
              <span>
                Cargas aprobadas
              </span>

              <strong>
                {formatNumber(
                  dashboard.transparencia
                    .aprobadas
                )}
              </strong>
            </div>

            <div>
              <span>
                Cargas rechazadas
              </span>

              <strong>
                {formatNumber(
                  dashboard.transparencia
                    .rechazadas
                )}
              </strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
