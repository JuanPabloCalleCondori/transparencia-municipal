import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  assignSiaTask,
  changeSiaTaskStatus,
  createSiaSubtask,
  createSiaTask,
  getSiaTasks,
} from "../../api/task.api";

import type {
  AssignmentUser,
} from "../../types/sia";

import type {
  SiaTask,
  TaskStatus,
} from "../../types/task";

import "./SiaTasksSection.css";


interface Props {
  idSolicitud: number;
  closed?: boolean;
  users?: AssignmentUser[];
}


interface TaskFormState {
  titulo: string;
  descripcion: string;
  fechaVencimiento: string;
}


const initialForm: TaskFormState = {
  titulo: "",
  descripcion: "",
  fechaVencimiento: "",
};


function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(
    new Date(value)
  );
}


function formatStatus(
  status: TaskStatus
) {
  return status.replaceAll(
    "_",
    " "
  );
}


function getAvailableStatuses(
  status: TaskStatus
): TaskStatus[] {
  switch (status) {
    case "PENDIENTE":
      return [
        "EN_PROCESO",
        "CANCELADA",
      ];

    case "EN_PROCESO":
      return [
        "COMPLETADA",
        "CANCELADA",
      ];

    default:
      return [];
  }
}


export default function SiaTasksSection({
  idSolicitud,
  closed = false,
  users = [],
}: Props) {

  const [
    tasks,
    setTasks,
  ] = useState<SiaTask[]>([]);

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


  /*
   * Formulario de tarea madre.
   */
  const [
    motherForm,
    setMotherForm,
  ] = useState<TaskFormState>(
    initialForm
  );

  const [
    creatingMother,
    setCreatingMother,
  ] = useState(false);


  /*
   * Formulario de subtarea.
   */
  const [
    showSubtaskForm,
    setShowSubtaskForm,
  ] = useState(false);

  const [
    subtaskForm,
    setSubtaskForm,
  ] = useState<TaskFormState>(
    initialForm
  );

  const [
    creatingSubtask,
    setCreatingSubtask,
  ] = useState(false);


  /*
   * Estado de operaciones.
   */
  const [
    updatingTaskId,
    setUpdatingTaskId,
  ] = useState<number | null>(
    null
  );

  const [
    assigningTaskId,
    setAssigningTaskId,
  ] = useState<number | null>(
    null
  );


  /*
   * Responsable seleccionado
   * por cada tarea.
   */
  const [
    selectedUsers,
    setSelectedUsers,
  ] = useState<
    Record<number, string>
  >({});


  const loadTasks =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getSiaTasks(
              idSolicitud
            );

          setTasks(
            response.tareas
          );

          /*
           * Dejamos seleccionados
           * los responsables actuales.
           */
          const selected:
            Record<number, string> =
              {};

          response.tareas.forEach(
            (task) => {
              selected[
                task.id_tarea
              ] =
                task.id_usuario_asignado
                  ? String(
                      task.id_usuario_asignado
                    )
                  : "";
            }
          );

          setSelectedUsers(
            selected
          );

        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar las tareas."
          );
        } finally {
          setLoading(false);
        }
      },
      [idSolicitud]
    );


  useEffect(() => {
    loadTasks();
  }, [loadTasks]);


  const rootTask =
    tasks.find(
      (task) =>
        task.id_tarea_padre ===
        null
    ) ?? null;


  const subtasks =
    rootTask
      ? tasks.filter(
          (task) =>
            task.id_tarea_padre ===
            rootTask.id_tarea
        )
      : [];


  /*
   * Crear tarea madre.
   */
  async function handleCreateMotherTask() {
    try {
      setError("");
      setSuccessMessage("");

      if (
        !motherForm.titulo.trim()
      ) {
        setError(
          "Debes ingresar un título para la tarea."
        );
        return;
      }

      setCreatingMother(true);

      const response =
        await createSiaTask(
          idSolicitud,
          {
            titulo:
              motherForm.titulo.trim(),

            descripcion:
              motherForm.descripcion.trim(),

            fechaVencimiento:
              motherForm.fechaVencimiento,
          }
        );

      setSuccessMessage(
        response.message ||
          "Tarea creada correctamente."
      );

      setMotherForm(
        initialForm
      );

      await loadTasks();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible crear la tarea."
      );
    } finally {
      setCreatingMother(false);
    }
  }


  /*
   * Crear subtarea.
   */
  async function handleCreateSubtask() {
    if (!rootTask) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      if (
        !subtaskForm.titulo.trim()
      ) {
        setError(
          "Debes ingresar un título para la subtarea."
        );
        return;
      }

      setCreatingSubtask(true);

      const response =
        await createSiaSubtask(
          idSolicitud,
          rootTask.id_tarea,
          {
            titulo:
              subtaskForm.titulo.trim(),

            descripcion:
              subtaskForm.descripcion.trim(),

            fechaVencimiento:
              subtaskForm.fechaVencimiento,
          }
        );

      setSuccessMessage(
        response.message ||
          "Subtarea creada correctamente."
      );

      setSubtaskForm(
        initialForm
      );

      setShowSubtaskForm(
        false
      );

      await loadTasks();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible crear la subtarea."
      );
    } finally {
      setCreatingSubtask(
        false
      );
    }
  }


  /*
   * Cambiar estado.
   */
  async function handleStatusChange(
    task: SiaTask,
    newStatus: TaskStatus
  ) {
    try {
      setError("");
      setSuccessMessage("");

      setUpdatingTaskId(
        task.id_tarea
      );

      const response =
        await changeSiaTaskStatus(
          idSolicitud,
          task.id_tarea,
          {
            estado: newStatus,
          }
        );

      setSuccessMessage(
        response.message ||
          "Estado actualizado correctamente."
      );

      await loadTasks();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible actualizar el estado."
      );
    } finally {
      setUpdatingTaskId(
        null
      );
    }
  }


  /*
   * Asignar o reasignar
   * responsable.
   */
  async function handleAssignResponsible(
    task: SiaTask
  ) {
    try {
      setError("");
      setSuccessMessage("");

      const selected =
        Number(
          selectedUsers[
            task.id_tarea
          ]
        );

      if (
        !Number.isInteger(
          selected
        ) ||
        selected <= 0
      ) {
        setError(
          "Debes seleccionar un responsable."
        );
        return;
      }

      setAssigningTaskId(
        task.id_tarea
      );

      const response =
        await assignSiaTask(
          idSolicitud,
          task.id_tarea,
          {
            idUsuarioAsignado:
              selected,
          }
        );

      setSuccessMessage(
        response.message ||
          "Responsable actualizado correctamente."
      );

      await loadTasks();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible asignar el responsable."
      );
    } finally {
      setAssigningTaskId(
        null
      );
    }
  }


  function renderTask(
    task: SiaTask,
    isSubtask = false
  ) {
    const responsible =
      task.usuario_nombre
        ? `${task.usuario_nombre} ${
            task.usuario_apellido ??
            ""
          }`.trim()
        : "Sin responsable";

    const availableStatuses =
      getAvailableStatuses(
        task.estado
      );

    const isFinished =
      [
        "COMPLETADA",
        "CANCELADA",
      ].includes(
        task.estado
      );

    return (
      <article
        key={task.id_tarea}
        className={`sia-task-card ${
          isSubtask
            ? "sia-subtask-card"
            : ""
        }`}
      >
        <div className="sia-task-header">
          <div>
            <span className="sia-task-type">
              {isSubtask
                ? "Subtarea"
                : "Tarea madre"}
            </span>

            <h4>
              {task.titulo}
            </h4>
          </div>

          <span
            className={`sia-task-status task-status-${task.estado.toLowerCase()}`}
          >
            {formatStatus(
              task.estado
            )}
          </span>
        </div>


        {task.descripcion && (
          <p className="sia-task-description">
            {task.descripcion}
          </p>
        )}


        <div className="sia-task-metadata">
          <div>
            <span>
              Responsable
            </span>

            <strong>
              {responsible}
            </strong>
          </div>

          <div>
            <span>
              Departamento
            </span>

            <strong>
              {task.departamento ??
                "Sin departamento"}
            </strong>
          </div>

          <div>
            <span>
              Vencimiento
            </span>

            <strong>
              {formatDate(
                task.fecha_vencimiento
              )}
            </strong>
          </div>
        </div>


        {!closed && (
          <div className="sia-task-actions">

            {/* RESPONSABLE */}
            {!isFinished &&
              users.length > 0 && (
                <div className="sia-task-action-group">

                  <label
                    htmlFor={`task-user-${task.id_tarea}`}
                  >
                    Responsable
                  </label>

                  <div className="sia-task-assignment-row">
                    <select
                      id={`task-user-${task.id_tarea}`}
                      value={
                        selectedUsers[
                          task.id_tarea
                        ] ?? ""
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedUsers(
                          (current) => ({
                            ...current,

                            [task.id_tarea]:
                              event.target
                                .value,
                          })
                        )
                      }
                      disabled={
                        assigningTaskId ===
                        task.id_tarea
                      }
                    >
                      <option value="">
                        Seleccionar responsable
                      </option>

                      {users.map(
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
                            {user.departamento
                              ? ` — ${user.departamento}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        handleAssignResponsible(
                          task
                        )
                      }
                      disabled={
                        assigningTaskId ===
                          task.id_tarea ||
                        !selectedUsers[
                          task.id_tarea
                        ]
                      }
                    >
                      {assigningTaskId ===
                      task.id_tarea
                        ? "Guardando..."
                        : task.id_usuario_asignado
                        ? "Reasignar"
                        : "Asignar"}
                    </button>
                  </div>
                </div>
              )}


            {/* ESTADO */}
            {!isFinished &&
              availableStatuses.length >
                0 && (
                <div className="sia-task-action-group">
                  <label
                    htmlFor={`task-status-${task.id_tarea}`}
                  >
                    Cambiar estado
                  </label>

                  <select
                    id={`task-status-${task.id_tarea}`}
                    value=""
                    disabled={
                      updatingTaskId ===
                      task.id_tarea
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target
                          .value as TaskStatus;

                      if (value) {
                        handleStatusChange(
                          task,
                          value
                        );
                      }
                    }}
                  >
                    <option value="">
                      Seleccionar estado
                    </option>

                    {availableStatuses.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {formatStatus(
                            status
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}
          </div>
        )}


        {!isSubtask &&
          !closed && (
            <div className="sia-task-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowSubtaskForm(
                    (current) =>
                      !current
                  );

                  setError("");
                  setSuccessMessage("");
                }}
              >
                {showSubtaskForm
                  ? "Cancelar subtarea"
                  : "+ Crear subtarea"}
              </button>
            </div>
          )}
      </article>
    );
  }


  return (
    <section className="sia-tasks-section">

      <div className="detail-section-title">
        <div>
          <h3>
            Tareas de la solicitud
          </h3>

          <p>
            Gestión de tarea madre,
            subtareas, responsables y
            estados internos.
          </p>
        </div>
      </div>


      {error && (
        <div className="form-error">
          {error}
        </div>
      )}


      {successMessage && (
        <div className="form-success">
          {successMessage}
        </div>
      )}


      {loading && (
        <div className="table-message">
          Cargando tareas...
        </div>
      )}


      {!loading &&
        !rootTask &&
        !closed && (
          <div className="sia-task-create-form">

            <h4>
              Crear tarea madre
            </h4>

            <div className="form-group">
              <label htmlFor="mother-title">
                Título
              </label>

              <input
                id="mother-title"
                type="text"
                value={
                  motherForm.titulo
                }
                onChange={(
                  event
                ) =>
                  setMotherForm(
                    (current) => ({
                      ...current,
                      titulo:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="Ej. Gestionar respuesta de solicitud"
              />
            </div>


            <div className="form-group">
              <label htmlFor="mother-description">
                Descripción
              </label>

              <textarea
                id="mother-description"
                value={
                  motherForm.descripcion
                }
                onChange={(
                  event
                ) =>
                  setMotherForm(
                    (current) => ({
                      ...current,
                      descripcion:
                        event.target
                          .value,
                    })
                  )
                }
                rows={3}
              />
            </div>


            <div className="form-group">
              <label htmlFor="mother-date">
                Fecha de vencimiento
              </label>

              <input
                id="mother-date"
                type="date"
                value={
                  motherForm
                    .fechaVencimiento
                }
                onChange={(
                  event
                ) =>
                  setMotherForm(
                    (current) => ({
                      ...current,
                      fechaVencimiento:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </div>


            <button
              type="button"
              className="primary-button"
              onClick={
                handleCreateMotherTask
              }
              disabled={
                creatingMother
              }
            >
              {creatingMother
                ? "Creando..."
                : "Crear tarea madre"}
            </button>
          </div>
        )}


      {!loading &&
        rootTask && (
          <>
            {renderTask(
              rootTask
            )}


            {showSubtaskForm &&
              !closed && (
                <div className="sia-task-create-form sia-subtask-create-form">

                  <h4>
                    Nueva subtarea
                  </h4>

                  <div className="form-group">
                    <label htmlFor="subtask-title">
                      Título
                    </label>

                    <input
                      id="subtask-title"
                      type="text"
                      value={
                        subtaskForm
                          .titulo
                      }
                      onChange={(
                        event
                      ) =>
                        setSubtaskForm(
                          (
                            current
                          ) => ({
                            ...current,

                            titulo:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />
                  </div>


                  <div className="form-group">
                    <label htmlFor="subtask-description">
                      Descripción
                    </label>

                    <textarea
                      id="subtask-description"
                      rows={3}
                      value={
                        subtaskForm
                          .descripcion
                      }
                      onChange={(
                        event
                      ) =>
                        setSubtaskForm(
                          (
                            current
                          ) => ({
                            ...current,

                            descripcion:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />
                  </div>


                  <div className="form-group">
                    <label htmlFor="subtask-date">
                      Fecha de vencimiento
                    </label>

                    <input
                      id="subtask-date"
                      type="date"
                      value={
                        subtaskForm
                          .fechaVencimiento
                      }
                      onChange={(
                        event
                      ) =>
                        setSubtaskForm(
                          (
                            current
                          ) => ({
                            ...current,

                            fechaVencimiento:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />
                  </div>


                  <div className="sia-task-form-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={
                        handleCreateSubtask
                      }
                      disabled={
                        creatingSubtask
                      }
                    >
                      {creatingSubtask
                        ? "Creando..."
                        : "Crear subtarea"}
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setShowSubtaskForm(
                          false
                        );

                        setSubtaskForm(
                          initialForm
                        );
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}


            {subtasks.length >
              0 && (
              <div className="sia-subtasks-list">

                <div className="sia-subtasks-heading">
                  <span>
                    Subtareas
                  </span>

                  <strong>
                    {subtasks.length}
                  </strong>
                </div>

                {subtasks.map(
                  (task) =>
                    renderTask(
                      task,
                      true
                    )
                )}
              </div>
            )}
          </>
        )}


      {!loading &&
        rootTask &&
        subtasks.length ===
          0 && (
          <div className="sia-task-empty">
            Esta tarea todavía no tiene
            subtareas.
          </div>
        )}
    </section>
  );
}
