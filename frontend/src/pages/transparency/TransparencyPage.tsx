import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  createTransparencyLoad,
  getTransparencyAssignmentOptions,
  getTransparencyItems,
  getTransparencyLoads,
} from "../../api/transparency.api";

import type {
  TransparencyItem,
  TransparencyLoad,
  TransparencyStatus,
  TransparencyUser,
} from "../../types/transparency";

import "./TransparencyPage.css";


function getCurrentMonth() {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}`;
}


function toApiPeriod(
  month: string
) {
  return `${month}-01`;
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


export default function TransparencyPage() {

  const navigate =
    useNavigate();

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    getCurrentMonth()
  );

  const [
    loads,
    setLoads,
  ] = useState<
    TransparencyLoad[]
  >([]);

  const [
    items,
    setItems,
  ] = useState<
    TransparencyItem[]
  >([]);

  const [
    users,
    setUsers,
  ] = useState<
    TransparencyUser[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    showCreate,
    setShowCreate,
  ] = useState(false);

  const [
    selectedItemId,
    setSelectedItemId,
  ] = useState("");

  const [
    selectedUserId,
    setSelectedUserId,
  ] = useState("");

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    createError,
    setCreateError,
  ] = useState("");


  const loadData =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getTransparencyLoads(
              toApiPeriod(
                selectedMonth
              )
            );

          setLoads(
            response.cargas
          );

        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar Transparencia Activa."
          );
        } finally {
          setLoading(false);
        }
      },
      [selectedMonth]
    );


  const loadFormOptions =
    useCallback(
      async () => {
        try {
          setCreateError("");

          const [
            itemResponse,
            assignmentResponse,
          ] = await Promise.all([
            getTransparencyItems(),
            getTransparencyAssignmentOptions(),
          ]);

          setItems(
            itemResponse.items.filter(
              (item) =>
                item.activo
            )
          );

          setUsers(
            assignmentResponse.usuarios
          );

        } catch (error) {
          setCreateError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar las opciones del formulario."
          );
        }
      },
      []
    );


  useEffect(() => {
    loadData();
  }, [loadData]);


  useEffect(() => {
    if (showCreate) {
      loadFormOptions();
    }
  }, [
    showCreate,
    loadFormOptions,
  ]);


  const selectedItem =
    useMemo(
      () =>
        items.find(
          (item) =>
            item.id_item ===
            Number(
              selectedItemId
            )
        ) ?? null,
      [
        items,
        selectedItemId,
      ]
    );


  const availableUsers =
    useMemo(
      () => {
        if (!selectedItem) {
          return [];
        }

        return users.filter(
          (user) =>
            user.id_departamento ===
            selectedItem.id_departamento_responsable
        );
      },
      [
        users,
        selectedItem,
      ]
    );


  useEffect(() => {
    setSelectedUserId("");
  }, [selectedItemId]);


  const statistics =
    useMemo(
      () => ({
        total:
          loads.length,

        pendientes:
          loads.filter(
            (load) =>
              load.estado ===
              "PENDIENTE"
          ).length,

        revision:
          loads.filter(
            (load) =>
              load.estado ===
              "EN_REVISION"
          ).length,

        publicados:
          loads.filter(
            (load) =>
              load.estado ===
              "PUBLICADO"
          ).length,
      }),
      [loads]
    );


  function openCreateForm() {
    setSelectedItemId("");
    setSelectedUserId("");
    setCreateError("");
    setShowCreate(true);
  }


  function closeCreateForm() {
    if (creating) {
      return;
    }

    setShowCreate(false);
    setSelectedItemId("");
    setSelectedUserId("");
    setCreateError("");
  }


  async function handleCreateLoad(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreateError("");

    const idItem =
      Number(
        selectedItemId
      );

    const idUsuarioResponsable =
      Number(
        selectedUserId
      );

    if (
      !Number.isInteger(idItem) ||
      idItem <= 0
    ) {
      setCreateError(
        "Debes seleccionar un ítem."
      );

      return;
    }

    if (
      !Number.isInteger(
        idUsuarioResponsable
      ) ||
      idUsuarioResponsable <= 0
    ) {
      setCreateError(
        "Debes seleccionar un responsable."
      );

      return;
    }

    try {
      setCreating(true);

      const response =
        await createTransparencyLoad({
          idItem,
          idUsuarioResponsable,
          periodo:
            toApiPeriod(
              selectedMonth
            ),
        });

      setShowCreate(false);

      setSelectedItemId("");
      setSelectedUserId("");

      await loadData();

      navigate(
        `/transparency/${response.carga.id_carga}`
      );

    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "No fue posible crear la carga mensual."
      );
    } finally {
      setCreating(false);
    }
  }


  return (
    <div className="transparency-page">

      <div className="transparency-page-header">

        <div>
          <h1>
            Transparencia Activa
          </h1>

          <p>
            Gestión mensual de
            antecedentes, revisión y
            publicación de información.
          </p>
        </div>


        <button
          type="button"
          className="transparency-primary-button"
          onClick={
            openCreateForm
          }
        >
          Nueva carga mensual
        </button>

      </div>


      <div className="transparency-toolbar">

        <div className="transparency-period-field">

          <label htmlFor="period">
            Período
          </label>

          <input
            id="period"
            type="month"
            value={
              selectedMonth
            }
            onChange={(event) =>
              setSelectedMonth(
                event.target.value
              )
            }
          />

        </div>

      </div>


      <div className="transparency-summary">

        <div className="transparency-summary-card">
          <span>
            Total
          </span>

          <strong>
            {statistics.total}
          </strong>
        </div>


        <div className="transparency-summary-card">
          <span>
            Pendientes
          </span>

          <strong>
            {statistics.pendientes}
          </strong>
        </div>


        <div className="transparency-summary-card">
          <span>
            En revisión
          </span>

          <strong>
            {statistics.revision}
          </strong>
        </div>


        <div className="transparency-summary-card">
          <span>
            Publicados
          </span>

          <strong>
            {statistics.publicados}
          </strong>
        </div>

      </div>


      <section className="transparency-list-card">

        <div className="transparency-list-header">

          <div>
            <h2>
              Cargas mensuales
            </h2>

            <p>
              {formatPeriod(
                toApiPeriod(
                  selectedMonth
                )
              )}
            </p>
          </div>

        </div>


        {error && (
          <div className="transparency-error">
            {error}
          </div>
        )}


        {loading && (
          <div className="transparency-message">
            Cargando información...
          </div>
        )}


        {!loading &&
          loads.length ===
            0 && (
            <div className="transparency-empty">

              <strong>
                Sin cargas registradas
              </strong>

              <span>
                No existen cargas de
                Transparencia Activa
                para este período.
              </span>

            </div>
          )}


        {!loading &&
          loads.length >
            0 && (
            <div className="transparency-table-wrapper">

              <table className="transparency-table">

                <thead>
                  <tr>

                    <th>
                      Ítem
                    </th>

                    <th>
                      Departamento
                    </th>

                    <th>
                      Responsable
                    </th>

                    <th>
                      Estado
                    </th>

                    <th>
                      Archivo
                    </th>

                    <th>
                      Acción
                    </th>

                  </tr>
                </thead>


                <tbody>

                  {loads.map(
                    (load) => (
                      <tr
                        key={
                          load.id_carga
                        }
                      >

                        <td>
                          <strong>
                            {
                              load.item
                            }
                          </strong>
                        </td>


                        <td>
                          {
                            load.departamento
                          }
                        </td>


                        <td>
                          {
                            load.responsable
                          }
                        </td>


                        <td>
                          <span
                            className={
                              `transparency-status transparency-status-${load.estado.toLowerCase()}`
                            }
                          >
                            {statusLabel(
                              load.estado
                            )}
                          </span>
                        </td>


                        <td>
                          {load.nombre_archivo ??
                            "Sin archivo"}
                        </td>


                        <td>
                          <button
                            type="button"
                            className="transparency-view-button"
                            onClick={() =>
                              navigate(
                                `/transparency/${load.id_carga}`
                              )
                            }
                          >
                            Ver detalle
                          </button>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

      </section>


      {showCreate && (
        <div
          className="transparency-modal-backdrop"
          onMouseDown={
            closeCreateForm
          }
        >

          <div
            className="transparency-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="transparency-modal-header">

              <div>
                <h2>
                  Nueva carga mensual
                </h2>

                <p>
                  Crea el control mensual
                  para un ítem de
                  Transparencia Activa.
                </p>
              </div>


              <button
                type="button"
                className="transparency-modal-close"
                onClick={
                  closeCreateForm
                }
                disabled={
                  creating
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                handleCreateLoad
              }
              className="transparency-create-form"
            >

              <div className="transparency-form-field">

                <label htmlFor="transparency-item">
                  Ítem
                </label>

                <select
                  id="transparency-item"
                  value={
                    selectedItemId
                  }
                  onChange={(event) =>
                    setSelectedItemId(
                      event.target.value
                    )
                  }
                  disabled={
                    creating
                  }
                >

                  <option value="">
                    Seleccionar ítem
                  </option>

                  {items.map(
                    (item) => (
                      <option
                        key={
                          item.id_item
                        }
                        value={
                          item.id_item
                        }
                      >
                        {
                          item.nombre
                        }
                      </option>
                    )
                  )}

                </select>

              </div>


              <div className="transparency-form-field">

                <label>
                  Departamento responsable
                </label>

                <div className="transparency-readonly-field">
                  {selectedItem
                    ? selectedItem
                        .departamento_responsable
                    : "Seleccione primero un ítem"}
                </div>

              </div>


              <div className="transparency-form-field">

                <label htmlFor="transparency-responsible">
                  Responsable
                </label>

                <select
                  id="transparency-responsible"
                  value={
                    selectedUserId
                  }
                  onChange={(event) =>
                    setSelectedUserId(
                      event.target.value
                    )
                  }
                  disabled={
                    !selectedItem ||
                    creating
                  }
                >

                  <option value="">
                    Seleccionar responsable
                  </option>

                  {availableUsers.map(
                    (user) => (
                      <option
                        key={
                          user.id_usuario
                        }
                        value={
                          user.id_usuario
                        }
                      >
                        {user.nombre}{" "}
                        {user.apellido}
                      </option>
                    )
                  )}

                </select>


                {selectedItem &&
                  availableUsers.length ===
                    0 && (
                    <span className="transparency-field-help">
                      No existen usuarios
                      activos disponibles en
                      este departamento.
                    </span>
                  )}

              </div>


              <div className="transparency-form-field">

                <label>
                  Período
                </label>

                <div className="transparency-readonly-field">
                  {formatPeriod(
                    toApiPeriod(
                      selectedMonth
                    )
                  )}
                </div>

              </div>


              {createError && (
                <div className="transparency-form-error">
                  {createError}
                </div>
              )}


              <div className="transparency-modal-actions">

                <button
                  type="button"
                  className="transparency-secondary-button"
                  onClick={
                    closeCreateForm
                  }
                  disabled={
                    creating
                  }
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  className="transparency-primary-button"
                  disabled={
                    creating
                  }
                >
                  {creating
                    ? "Creando..."
                    : "Crear carga"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
