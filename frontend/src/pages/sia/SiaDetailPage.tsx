import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  assignSiaRequest,
  changeSiaStatus,
  createSiaExtension,
  getAssignmentOptions,
  getSiaRequestById,
} from "../../api/sia.api";

import type {
  AssignmentDepartment,
  AssignmentUser,
  SiaRequest,
} from "../../types/sia";

import {
  formatDate,
  getDeadlineStatus,
} from "../../utils/deadline";

import SiaTasksSection
  from "../../components/sia/SiaTasksSection";


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


  /*
   * Solicitud.
   */
  const [
    request,
    setRequest,
  ] = useState<SiaRequest | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /*
   * Opciones de asignación.
   */
  const [
    departments,
    setDepartments,
  ] = useState<
    AssignmentDepartment[]
  >([]);

  const [
    users,
    setUsers,
  ] = useState<
    AssignmentUser[]
  >([]);

  const [
    selectedDepartment,
    setSelectedDepartment,
  ] = useState("");

  const [
    selectedResponsible,
    setSelectedResponsible,
  ] = useState("");


  /*
   * Estado del proceso
   * de asignación.
   */
  const [
    assigning,
    setAssigning,
  ] = useState(false);

  const [
    assignmentMessage,
    setAssignmentMessage,
  ] = useState("");

  const [
    assignmentError,
    setAssignmentError,
  ] = useState("");


  /*
   * Estado del proceso
   * de cambio de estado.
   */
  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("");

  const [
    changingStatus,
    setChangingStatus,
  ] = useState(false);

  const [
    statusMessage,
    setStatusMessage,
  ] = useState("");

  const [
    statusError,
    setStatusError,
  ] = useState("");


  /*
   * Estado del proceso
   * de prórroga.
   */
  const [
    extensionReason,
    setExtensionReason,
  ] = useState("");

  const [
    applyingExtension,
    setApplyingExtension,
  ] = useState(false);

  const [
    extensionMessage,
    setExtensionMessage,
  ] = useState("");

  const [
    extensionError,
    setExtensionError,
  ] = useState("");

  const [
    extensionResolution,
    setExtensionResolution,
  ] = useState<string | null>(
    null
  );


  /*
   * Carga inicial.
   */
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


        /*
         * Cargamos el detalle
         * de la solicitud.
         */
        const response =
          await getSiaRequestById(
            numericId
          );

        setRequest(
          response.solicitud
        );


        /*
         * Cargamos departamentos
         * y usuarios disponibles
         * para asignación.
         */
        const options =
          await getAssignmentOptions();

        setDepartments(
          options.departamentos
        );

        setUsers(
          options.usuarios
        );


        /*
         * Sincronizamos los select
         * con la asignación actual.
         */
        if (
          response.solicitud
            .id_departamento
        ) {
          setSelectedDepartment(
            String(
              response.solicitud
                .id_departamento
            )
          );
        } else {
          setSelectedDepartment("");
        }


        if (
          response.solicitud
            .id_responsable
        ) {
          setSelectedResponsible(
            String(
              response.solicitud
                .id_responsable
            )
          );
        } else {
          setSelectedResponsible("");
        }

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


  /*
   * Usuarios pertenecientes
   * al departamento seleccionado.
   */
  const filteredUsers =
    users.filter(
      (user) =>
        user.id_departamento ===
        Number(
          selectedDepartment
        )
    );


  /*
   * Asignar o reasignar
   * solicitud.
   */
  async function handleAssign() {
    try {
      setAssignmentError("");
      setAssignmentMessage("");

      if (!request) {
        return;
      }

      const idDepartamento =
        Number(
          selectedDepartment
        );

      const idResponsable =
        Number(
          selectedResponsible
        );


      if (
        !Number.isInteger(
          idDepartamento
        ) ||
        idDepartamento <= 0 ||
        !Number.isInteger(
          idResponsable
        ) ||
        idResponsable <= 0
      ) {
        setAssignmentError(
          "Debes seleccionar un departamento y un responsable."
        );

        return;
      }


      setAssigning(true);


      const assignmentResponse =
        await assignSiaRequest(
          request.id_solicitud,
          {
            idDepartamento,
            idResponsable,
          }
        );


      /*
       * Volvemos a consultar el
       * detalle completo.
       */
      const detailResponse =
        await getSiaRequestById(
          request.id_solicitud
        );

      setRequest(
        detailResponse.solicitud
      );


      /*
       * Sincronizamos select.
       */
      if (
        detailResponse.solicitud
          .id_departamento
      ) {
        setSelectedDepartment(
          String(
            detailResponse.solicitud
              .id_departamento
          )
        );
      }


      if (
        detailResponse.solicitud
          .id_responsable
      ) {
        setSelectedResponsible(
          String(
            detailResponse.solicitud
              .id_responsable
          )
        );
      }


      setAssignmentMessage(
        assignmentResponse.message ||
          "Solicitud asignada correctamente."
      );

    } catch (error) {
      setAssignmentError(
        error instanceof Error
          ? error.message
          : "No fue posible asignar la solicitud."
      );
    } finally {
      setAssigning(false);
    }
  }


  /*
   * Cambiar estado.
   */
  async function handleChangeStatus() {
    try {
      setStatusError("");
      setStatusMessage("");

      if (!request) {
        return;
      }

      const idEstado =
        Number(
          selectedStatus
        );


      if (
        !Number.isInteger(
          idEstado
        ) ||
        idEstado <= 0
      ) {
        setStatusError(
          "Debes seleccionar un nuevo estado."
        );

        return;
      }


      setChangingStatus(true);


      const statusResponse =
        await changeSiaStatus(
          request.id_solicitud,
          {
            idEstado,
          }
        );


      /*
       * Volvemos a consultar
       * el detalle completo.
       */
      const detailResponse =
        await getSiaRequestById(
          request.id_solicitud
        );

      setRequest(
        detailResponse.solicitud
      );

      setSelectedStatus("");


      setStatusMessage(
        statusResponse.message ||
          "Estado actualizado correctamente."
      );

    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado."
      );
    } finally {
      setChangingStatus(false);
    }
  }


  /*
   * Aplicar prórroga.
   */
  async function handleCreateExtension() {
    try {
      setExtensionError("");
      setExtensionMessage("");
      setExtensionResolution(null);

      if (!request) {
        return;
      }


      const motivo =
        extensionReason.trim();


      if (!motivo) {
        setExtensionError(
          "Debes ingresar el motivo de la prórroga."
        );

        return;
      }


      if (motivo.length < 10) {
        setExtensionError(
          "El motivo debe contener al menos 10 caracteres."
        );

        return;
      }


      if (request.tiene_prorroga) {
        setExtensionError(
          "La solicitud ya tiene una prórroga aplicada."
        );

        return;
      }


      setApplyingExtension(true);


      const extensionResponse =
        await createSiaExtension(
          request.id_solicitud,
          {
            motivo,
          }
        );


      /*
       * Consultamos nuevamente
       * el detalle completo.
       */
      const detailResponse =
        await getSiaRequestById(
          request.id_solicitud
        );

      setRequest(
        detailResponse.solicitud
      );

      setExtensionReason("");


      setExtensionResolution(
        extensionResponse.prorroga
          ?.numero_resolucion ??
          null
      );


      setExtensionMessage(
        extensionResponse.message ||
          "Prórroga aplicada correctamente."
      );

    } catch (error) {
      setExtensionError(
        error instanceof Error
          ? error.message
          : "No fue posible aplicar la prórroga."
      );
    } finally {
      setApplyingExtension(false);
    }
  }


  /*
   * Estado de carga.
   */
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


  /*
   * Error de carga.
   */
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


  /*
   * Estados terminales.
   */
  const closed =
    [
      "FINALIZADA",
      "CANCELADA",
    ].includes(
      request.estado ?? ""
    );


  /*
   * Plazo.
   */
  const deadline =
    request.fecha_vencimiento
      ? getDeadlineStatus(
          request.fecha_vencimiento
        )
      : null;


  /*
   * Responsable.
   */
  const responsible =
    request.responsable_nombre?.trim()
      ? `${request.responsable_nombre} ${
          request.responsable_apellido ??
          ""
        }`.trim()
      : request.responsable?.trim()
      ? request.responsable
      : "Sin responsable";


  /*
   * Departamento.
   */
  const department =
    request.departamento?.trim()
      ? request.departamento
      : "Sin asignar";


  /*
   * Clase CSS del estado.
   */
  const stateClass =
    (
      request.estado ??
      "desconocido"
    ).toLowerCase();


  /*
   * Transiciones disponibles.
   */
  const statusTransitions: Record<
    string,
    {
      id: number;
      name: string;
    }[]
  > = {
    ASIGNADA: [
      {
        id: 3,
        name: "EN PROCESO",
      },
      {
        id: 7,
        name: "CANCELADA",
      },
    ],

    EN_PROCESO: [
      {
        id: 4,
        name: "EN REVISIÓN",
      },
      {
        id: 7,
        name: "CANCELADA",
      },
    ],

    EN_REVISION: [
      {
        id: 5,
        name: "FINALIZADA",
      },
      {
        id: 3,
        name: "VOLVER A EN PROCESO",
      },
      {
        id: 7,
        name: "CANCELADA",
      },
    ],
  };


  const availableStatuses =
    statusTransitions[
      request.estado
    ] ?? [];


  return (
    <section>

      {/* =========================
          ENCABEZADO
          ========================= */}
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

        {/* =========================
            COLUMNA PRINCIPAL
            ========================= */}
        <div className="sia-detail-main">


          {/* INFORMACIÓN */}
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


          {/* =========================
              GESTIÓN INTERNA
              ========================= */}
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


            {/* =========================
                ASIGNACIÓN
                ========================= */}
            {!closed && (
              <div className="assignment-section">

                <div className="detail-section-title">
                  <h3>
                    Asignación de solicitud
                  </h3>
                </div>


                <div className="assignment-grid">

                  <div className="form-group">
                    <label
                      htmlFor="sia-department"
                    >
                      Departamento
                    </label>

                    <select
                      id="sia-department"
                      value={
                        selectedDepartment
                      }
                      onChange={(event) => {
                        setSelectedDepartment(
                          event.target.value
                        );

                        setSelectedResponsible(
                          ""
                        );

                        setAssignmentMessage(
                          ""
                        );

                        setAssignmentError(
                          ""
                        );
                      }}
                    >
                      <option value="">
                        Seleccionar departamento
                      </option>

                      {departments.map(
                        (
                          department
                        ) => (
                          <option
                            key={
                              department
                                .id_departamento
                            }
                            value={
                              department
                                .id_departamento
                            }
                          >
                            {
                              department.nombre
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>


                  <div className="form-group">
                    <label
                      htmlFor="sia-responsible"
                    >
                      Responsable
                    </label>

                    <select
                      id="sia-responsible"
                      value={
                        selectedResponsible
                      }
                      onChange={(event) => {
                        setSelectedResponsible(
                          event.target.value
                        );

                        setAssignmentMessage(
                          ""
                        );

                        setAssignmentError(
                          ""
                        );
                      }}
                      disabled={
                        !selectedDepartment
                      }
                    >
                      <option value="">
                        Seleccionar responsable
                      </option>

                      {filteredUsers.map(
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
                  </div>

                </div>


                {selectedDepartment &&
                  filteredUsers.length ===
                    0 && (
                    <p className="assignment-warning">
                      No existen usuarios
                      activos disponibles
                      para este departamento.
                    </p>
                  )}


                {assignmentError && (
                  <div className="form-error">
                    {assignmentError}
                  </div>
                )}


                {assignmentMessage && (
                  <div className="form-success">
                    {assignmentMessage}
                  </div>
                )}


                <div className="assignment-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={
                      handleAssign
                    }
                    disabled={
                      assigning ||
                      !selectedDepartment ||
                      !selectedResponsible
                    }
                  >
                    {assigning
                      ? "Asignando..."
                      : request.id_responsable
                      ? "Reasignar solicitud"
                      : "Asignar solicitud"}
                  </button>
                </div>

              </div>
            )}


            {/* =========================
                CAMBIO DE ESTADO
                ========================= */}
            {!closed &&
              availableStatuses.length >
                0 && (
                <div className="status-management-section">

                  <div className="detail-section-title">
                    <h3>
                      Cambiar estado
                    </h3>
                  </div>


                  <div className="status-management-row">

                    <div className="form-group">
                      <label
                        htmlFor="sia-status"
                      >
                        Nuevo estado
                      </label>

                      <select
                        id="sia-status"
                        value={
                          selectedStatus
                        }
                        onChange={(event) => {
                          setSelectedStatus(
                            event.target.value
                          );

                          setStatusError(
                            ""
                          );

                          setStatusMessage(
                            ""
                          );
                        }}
                      >
                        <option value="">
                          Seleccionar estado
                        </option>

                        {availableStatuses.map(
                          (status) => (
                            <option
                              key={
                                status.id
                              }
                              value={
                                status.id
                              }
                            >
                              {status.name}
                            </option>
                          )
                        )}
                      </select>
                    </div>


                    <button
                      type="button"
                      className="primary-button"
                      onClick={
                        handleChangeStatus
                      }
                      disabled={
                        changingStatus ||
                        !selectedStatus
                      }
                    >
                      {changingStatus
                        ? "Actualizando..."
                        : "Actualizar estado"}
                    </button>

                  </div>


                  {statusError && (
                    <div className="form-error">
                      {statusError}
                    </div>
                  )}


                  {statusMessage && (
                    <div className="form-success">
                      {statusMessage}
                    </div>
                  )}

                </div>
              )}


            {/* =========================
                PRÓRROGA
                ========================= */}
            {!closed && (
              <div className="extension-section">

                <div className="detail-section-title">
                  <h3>
                    Prórroga de solicitud
                  </h3>
                </div>


                {request.tiene_prorroga ? (
                  <div className="extension-applied">

                    <div className="extension-applied-header">
                      <span className="extension-check">
                        ✓
                      </span>

                      <div>
                        <strong>
                          Prórroga aplicada
                        </strong>

                        <p>
                          La solicitud dispone de
                          10 días hábiles adicionales.
                        </p>
                      </div>
                    </div>


                    <div className="extension-info-grid">

                      <div className="detail-field">
                        <span>
                          Nuevo vencimiento
                        </span>

                        <strong>
                          {formatDate(
                            request.fecha_vencimiento
                          )}
                        </strong>
                      </div>


                      {extensionResolution && (
                        <div className="detail-field">
                          <span>
                            Resolución
                          </span>

                          <strong>
                            {extensionResolution}
                          </strong>
                        </div>
                      )}

                    </div>


                    {extensionMessage && (
                      <div className="form-success">
                        {extensionMessage}
                      </div>
                    )}

                  </div>
                ) : (
                  <>
                    <p className="extension-description">
                      La prórroga permite extender
                      el plazo de respuesta de esta
                      solicitud en 10 días hábiles.
                      Debe existir una justificación
                      antes de aplicarla.
                    </p>


                    <div className="form-group">
                      <label
                        htmlFor="extension-reason"
                      >
                        Motivo de la prórroga
                      </label>

                      <textarea
                        id="extension-reason"
                        rows={4}
                        value={
                          extensionReason
                        }
                        placeholder="Ej: Se requiere tiempo adicional para recopilar y validar antecedentes provenientes de las unidades municipales involucradas."
                        onChange={(event) => {
                          setExtensionReason(
                            event.target.value
                          );

                          setExtensionError(
                            ""
                          );

                          setExtensionMessage(
                            ""
                          );
                        }}
                        disabled={
                          applyingExtension
                        }
                      />

                      <span className="form-help">
                        La extensión será de
                        10 días hábiles.
                      </span>
                    </div>


                    {extensionError && (
                      <div className="form-error">
                        {extensionError}
                      </div>
                    )}


                    {extensionMessage && (
                      <div className="form-success">
                        {extensionMessage}
                      </div>
                    )}


                    <div className="extension-actions">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={
                          handleCreateExtension
                        }
                        disabled={
                          applyingExtension ||
                          !extensionReason.trim()
                        }
                      >
                        {applyingExtension
                          ? "Aplicando..."
                          : "Aplicar prórroga"}
                      </button>
                    </div>
                  </>
                )}

              </div>
            )}

          </div>
          
          <SiaTasksSection
              idSolicitud={
                request.id_solicitud
         }
              closed={closed}
              users={users}
        />
        </div>


        {/* =========================
            SIDEBAR
            ========================= */}
        <aside className="sia-detail-sidebar">

          {/* PLAZO */}
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


          {/* IDENTIFICACIÓN */}
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
