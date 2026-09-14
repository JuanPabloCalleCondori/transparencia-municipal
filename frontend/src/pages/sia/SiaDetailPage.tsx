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
   * Estado del proceso de
   * asignación.
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
         * Si la solicitud ya tiene
         * asignación, dejamos los
         * select posicionados en
         * esos valores.
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
   * Usuarios pertenecientes al
   * departamento seleccionado.
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
   * la solicitud.
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

    /*
     * Realizamos la asignación.
     */
    const assignmentResponse =
      await assignSiaRequest(
        request.id_solicitud,
        {
          idDepartamento,
          idResponsable,
        }
      );

    /*
     * Volvemos a consultar el detalle
     * completo porque el PATCH puede
     * devolver solo los datos base y no
     * los nombres de estado, departamento
     * y responsable.
     */
    const detailResponse =
      await getSiaRequestById(
        request.id_solicitud
      );

    setRequest(
      detailResponse.solicitud
    );

    /*
     * Sincronizamos los select con
     * los datos recién guardados.
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
    request.responsable_nombre?.trim()
      ? `${request.responsable_nombre} ${request.responsable_apellido ?? ""}`.trim()
      : request.responsable?.trim()
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

      {/* ENCABEZADO */}
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

        {/* COLUMNA PRINCIPAL */}
        <div className="sia-detail-main">

          {/* INFORMACIÓN SOLICITUD */}
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


          {/* GESTIÓN INTERNA */}
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


            {/* ASIGNACIÓN */}
            {!closed && (
              <div className="assignment-section">

                <div className="detail-section-title">
                  <h3>
                    Asignación de solicitud
                  </h3>
                </div>


                <div className="assignment-grid">

                  {/* DEPARTAMENTO */}
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

                        /*
                         * Si cambia el
                         * departamento,
                         * limpiamos responsable.
                         */
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


                  {/* RESPONSABLE */}
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


                {/* SIN FUNCIONARIOS */}
                {selectedDepartment &&
                  filteredUsers.length ===
                    0 && (
                    <p className="assignment-warning">
                      No existen usuarios
                      activos disponibles
                      para este departamento.
                    </p>
                  )}


                {/* ERROR */}
                {assignmentError && (
                  <div className="form-error">
                    {assignmentError}
                  </div>
                )}


                {/* ÉXITO */}
                {assignmentMessage && (
                  <div className="form-success">
                    {assignmentMessage}
                  </div>
                )}


                {/* BOTÓN */}
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

          </div>
        </div>


        {/* SIDEBAR */}
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
