import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  changeSiaTaskStatus,
  createSiaSubtask,
  createSiaTask,
  getSiaTasks,
} from "../../api/task.api";

import type {
  SiaTask,
  TaskStatus,
} from "../../types/task";

import {
  formatDate,
} from "../../utils/deadline";

import "./SiaTasksSection.css";


interface Props {
  idSolicitud: number;
  closed?: boolean;
}


interface TaskFormState {
  titulo: string;
  descripcion: string;
  fechaVencimiento: string;
}


const emptyForm: TaskFormState = {
  titulo: "",
  descripcion: "",
  fechaVencimiento: "",
};


function formatTaskStatus(
  status: string
) {
  return status.replaceAll(
    "_",
    " "
  );
}


function getTaskResponsible(
  task: SiaTask
) {
  if (
    task.usuario_nombre?.trim()
  ) {
    return `${task.usuario_nombre} ${
      task.usuario_apellido ?? ""
    }`.trim();
  }

  return "Sin responsable";
}


export default function SiaTasksSection({
  idSolicitud,
  closed = false,
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
    message,
    setMessage,
  ] = useState("");


  /*
   * Formulario tarea madre.
   */
  const [
    showTaskForm,
    setShowTaskForm,
  ] = useState(false);

  const [
    taskForm,
    setTaskForm,
  ] = useState<TaskFormState>(
    emptyForm
  );

  const [
    creatingTask,
    setCreatingTask,
  ] = useState(false);


  /*
   * Formulario subtarea.
   */
  const [
    subtaskParentId,
    setSubtaskParentId,
  ] = useState<number | null>(
    null
  );

  const [
    subtaskForm,
    setSubtaskForm,
  ] = useState<TaskFormState>(
    emptyForm
  );

  const [
    creatingSubtask,
    setCreatingSubtask,
  ] = useState(false);


  /*
   * Estado que está siendo
   * actualizado.
   */
  const [
    changingTaskId,
    setChangingTaskId,
  ] = useState<number | null>(
    null
  );


  /*
   * Cargar tareas.
   */
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


  /*
   * Tarea madre.
   */
  const rootTask =
    tasks.find(
      (task) =>
        task.id_tarea_padre === null
    ) ?? null;


  /*
   * Subtareas de la tarea madre.
   */
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
  async function handleCreateTask() {
    try {
      setError("");
      setMessage("");

      const titulo =
        taskForm.titulo.trim();

      const descripcion =
        taskForm.descripcion.trim();

      const fechaVencimiento =
        taskForm.fechaVencimiento;


      if (!titulo) {
        setError(
          "Debes ingresar el título de la tarea."
        );

        return;
      }


      if (!descripcion) {
        setError(
          "Debes ingresar una descripción."
        );

        return;
      }


      if (!fechaVencimiento) {
        setError(
          "Debes seleccionar una fecha de vencimiento."
        );

        return;
      }


      setCreatingTask(true);


      const response =
        await createSiaTask(
          idSolicitud,
          {
            titulo,
            descripcion,
            fechaVencimiento,
          }
        );


      setTaskForm(
        emptyForm
      );

      setShowTaskForm(false);


      setMessage(
        response.message ||
          "Tarea creada correctamente."
      );


      await loadTasks();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible crear la tarea."
      );
    } finally {
      setCreatingTask(false);
    }
  }


  /*
   * Crear subtarea.
   */
  async function handleCreateSubtask() {
    try {
      setError("");
      setMessage("");


      if (!subtaskParentId) {
        return;
      }


      const titulo =
        subtaskForm.titulo.trim();

      const descripcion =
        subtaskForm.descripcion.trim();

      const fechaVencimiento =
        subtaskForm.fechaVencimiento;


      if (!titulo) {
        setError(
          "Debes ingresar el título de la subtarea."
        );

        return;
      }


      if (!descripcion) {
        setError(
          "Debes ingresar una descripción."
        );

        return;
      }


      if (!fechaVencimiento) {
        setError(
          "Debes seleccionar una fecha de vencimiento."
        );

        return;
      }


      setCreatingSubtask(true);


      const response =
        await createSiaSubtask(
          idSolicitud,
          subtaskParentId,
          {
            titulo,
            descripcion,
            fechaVencimiento,
          }
        );


      setSubtaskForm(
        emptyForm
      );

      setSubtaskParentId(
        null
      );


      setMessage(
        response.message ||
          "Subtarea creada correctamente."
      );


      await loadTasks();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible crear la subtarea."
      );
    } finally {
      setCreatingSubtask(false);
    }
  }


  /*
   * Cambiar estado.
   */
  async function handleStatusChange(
    task: SiaTask,
    estado: TaskStatus
  ) {
    try {
      setError("");
      setMessage("");

      setChangingTaskId(
        task.id_tarea
      );


      const response =
        await changeSiaTaskStatus(
          idSolicitud,
          task.id_tarea,
          {
            estado,
          }
        );


      setMessage(
        response.message ||
          "Estado de tarea actualizado correctamente."
      );


      await loadTasks();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado de la tarea."
      );
    } finally {
      setChangingTaskId(
        null
      );
    }
  }


  /*
   * Render formulario.
   */
  function renderTaskForm(
    form: TaskFormState,
    setForm: React.Dispatch<
      React.SetStateAction<TaskFormState>
    >,
    onSubmit: () => void,
    loading: boolean,
    submitText: string,
    cancel: () => void
  ) {
    return (
      <div className="task-form">

        <div className="form-group">
          <label>
            Título
          </label>

          <input
            type="text"
            value={
              form.titulo
            }
            placeholder="Ej: Recopilar antecedentes financieros"
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                titulo:
                  event.target.value,
              }));
            }}
          />
        </div>


        <div className="form-group">
          <label>
            Descripción
          </label>

          <textarea
            rows={3}
            value={
              form.descripcion
            }
            placeholder="Describe el trabajo que debe realizarse..."
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                descripcion:
                  event.target.value,
              }));
            }}
          />
        </div>


        <div className="form-group">
          <label>
            Fecha de vencimiento
          </label>

          <input
            type="date"
            value={
              form.fechaVencimiento
            }
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                fechaVencimiento:
                  event.target.value,
              }));
            }}
          />
        </div>


        <div className="task-form-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={
              cancel
            }
            disabled={
              loading
            }
          >
            Cancelar
          </button>


          <button
            type="button"
            className="primary-button"
            onClick={
              onSubmit
            }
            disabled={
              loading
            }
          >
            {loading
              ? "Guardando..."
              : submitText}
          </button>

        </div>

      </div>
    );
  }


  /*
   * Render tarjeta de tarea.
   */
  function renderTask(
    task: SiaTask,
    isRoot: boolean
  ) {
    const responsible =
      getTaskResponsible(
        task
      );

    const taskClosed =
      [
        "COMPLETADA",
        "CANCELADA",
      ].includes(
        task.estado
      );


    return (
      <div
        key={task.id_tarea}
        className={
          isRoot
            ? "sia-task-card sia-task-root"
            : "sia-task-card sia-subtask-card"
        }
      >

        <div className="sia-task-header">

          <div>
            <div className="sia-task-type">
              {isRoot
                ? "Tarea principal"
                : "Subtarea"}
            </div>

            <h4>
              {task.titulo}
            </h4>
          </div>


          <span
            className={`task-status task-status-${task.estado.toLowerCase()}`}
          >
            {formatTaskStatus(
              task.estado
            )}
          </span>

        </div>


        {task.descripcion && (
          <p className="sia-task-description">
            {task.descripcion}
          </p>
        )}


        <div className="sia-task-meta">

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
              {task.departamento ||
                "Sin departamento"}
            </strong>
          </div>


          <div>
            <span>
              Vencimiento
            </span>

            <strong>
              {task.fecha_vencimiento
                ? formatDate(
                    task.fecha_vencimiento
                  )
                : "Sin fecha"}
            </strong>
          </div>

        </div>


        {!closed &&
          !taskClosed && (
            <div className="sia-task-actions">

              <label>
                Estado

                <select
                  value={
                    task.estado
                  }
                  disabled={
                    changingTaskId ===
                    task.id_tarea
                  }
                  onChange={(event) => {
                    handleStatusChange(
                      task,
                      event.target
                        .value as TaskStatus
                    );
                  }}
                >

                  <option
                    value={
                      task.estado
                    }
                  >
                    {formatTaskStatus(
                      task.estado
                    )}
                  </option>


                  {task.estado ===
                    "PENDIENTE" && (
                    <>
                      <option value="EN_PROCESO">
                        EN PROCESO
                      </option>

                      <option value="CANCELADA">
                        CANCELADA
                      </option>
                    </>
                  )}


                  {task.estado ===
                    "EN_PROCESO" && (
                    <>
                      <option value="COMPLETADA">
                        COMPLETADA
                      </option>

                      <option value="CANCELADA">
                        CANCELADA
                      </option>
                    </>
                  )}

                </select>
              </label>


              {isRoot && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setSubtaskParentId(
                      task.id_tarea
                    );

                    setSubtaskForm(
                      emptyForm
                    );

                    setError("");
                    setMessage("");
                  }}
                >
                  + Crear subtarea
                </button>
              )}

            </div>
          )}


        {isRoot &&
          subtaskParentId ===
            task.id_tarea && (
            <div className="subtask-form-container">

              <h4>
                Nueva subtarea
              </h4>

              {renderTaskForm(
                subtaskForm,
                setSubtaskForm,
                handleCreateSubtask,
                creatingSubtask,
                "Crear subtarea",
                () => {
                  setSubtaskParentId(
                    null
                  );

                  setSubtaskForm(
                    emptyForm
                  );
                }
              )}

            </div>
          )}

      </div>
    );
  }


  return (
    <div className="content-card sia-tasks-section">

      <div className="sia-tasks-heading">

        <div>
          <h2>
            Tareas de la solicitud
          </h2>

          <p>
            Gestión interna de tareas
            y subtareas asociadas a
            esta solicitud.
          </p>
        </div>


        {!closed &&
          !rootTask &&
          !showTaskForm && (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setShowTaskForm(
                  true
                );

                setError("");
                setMessage("");
              }}
            >
              + Crear tarea principal
            </button>
          )}

      </div>


      {error && (
        <div className="form-error">
          {error}
        </div>
      )}


      {message && (
        <div className="form-success">
          {message}
        </div>
      )}


      {showTaskForm &&
        !rootTask && (
          <div className="task-create-container">

            <h3>
              Nueva tarea principal
            </h3>

            {renderTaskForm(
              taskForm,
              setTaskForm,
              handleCreateTask,
              creatingTask,
              "Crear tarea",
              () => {
                setShowTaskForm(
                  false
                );

                setTaskForm(
                  emptyForm
                );
              }
            )}

          </div>
        )}


      {loading ? (
        <div className="table-message">
          Cargando tareas...
        </div>
      ) : tasks.length === 0 ? (
        <div className="sia-task-empty">

          <strong>
            No existen tareas registradas.
          </strong>

          <span>
            La solicitud todavía no
            cuenta con una tarea principal.
          </span>

        </div>
      ) : (
        <div className="sia-task-tree">

          {rootTask &&
            renderTask(
              rootTask,
              true
            )}


          {subtasks.length >
            0 && (
            <div className="sia-subtasks">

              <div className="sia-subtasks-title">
                Subtareas
              </div>

              {subtasks.map(
                (task) =>
                  renderTask(
                    task,
                    false
                  )
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}
