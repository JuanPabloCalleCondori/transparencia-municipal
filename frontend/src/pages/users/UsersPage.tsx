import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  activateUser,
  createUser,
  deactivateUser,
  getUserOptions,
  getUsers,
  updateUser,
} from "../../api/user.api";

import {
  useAuth,
} from "../../context/AuthContext";

import type {
  ManagedUser,
  UserDepartmentOption,
  UserRoleOption,
} from "../../types/user";

import "./UsersPage.css";


interface UserFormState {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  idRol: string;
  idDepartamento: string;
}


const EMPTY_FORM:
  UserFormState = {
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    idRol: "",
    idDepartamento: "",
  };


function formatDate(
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
    }
  ).format(date);
}


function formatRole(
  role: string
) {
  return role
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}


export default function UsersPage() {

  const {
    user: currentUser,
  } = useAuth();


  const [
    users,
    setUsers,
  ] = useState<
    ManagedUser[]
  >([]);


  const [
    roles,
    setRoles,
  ] = useState<
    UserRoleOption[]
  >([]);


  const [
    departments,
    setDepartments,
  ] = useState<
    UserDepartmentOption[]
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
    success,
    setSuccess,
  ] = useState("");


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "TODOS" |
    "ACTIVOS" |
    "INACTIVOS"
  >("TODOS");


  const [
    showForm,
    setShowForm,
  ] = useState(false);


  const [
    editingUser,
    setEditingUser,
  ] = useState<
    ManagedUser | null
  >(null);


  const [
    form,
    setForm,
  ] = useState<UserFormState>(
    EMPTY_FORM
  );


  const [
    formError,
    setFormError,
  ] = useState("");


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    deactivatingId,
    setDeactivatingId,
  ] = useState<
    number | null
  >(null);


  const [
    activatingId,
    setActivatingId,
  ] = useState<
    number | null
  >(null);


  const loadData =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            usersData,
            optionsData,
          ] = await Promise.all([
            getUsers(),
            getUserOptions(),
          ]);

          setUsers(
            usersData
          );

          setRoles(
            optionsData.roles
          );

          setDepartments(
            optionsData
              .departamentos
          );

        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar los usuarios."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    loadData();
  }, [loadData]);


  const statistics =
    useMemo(
      () => ({
        total:
          users.length,

        activos:
          users.filter(
            (user) =>
              user.activo
          ).length,

        inactivos:
          users.filter(
            (user) =>
              !user.activo
          ).length,

        departamentos:
          new Set(
            users
              .filter(
                (user) =>
                  user.activo &&
                  user.id_departamento
              )
              .map(
                (user) =>
                  user.id_departamento
              )
          ).size,
      }),
      [users]
    );


  const filteredUsers =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return users.filter(
          (user) => {
            const matchesStatus =
              statusFilter ===
                "TODOS" ||
              (
                statusFilter ===
                  "ACTIVOS" &&
                user.activo
              ) ||
              (
                statusFilter ===
                  "INACTIVOS" &&
                !user.activo
              );


            if (
              !matchesStatus
            ) {
              return false;
            }


            if (
              !normalizedSearch
            ) {
              return true;
            }


            const values = [
              user.nombre,
              user.apellido,
              user.email,
              user.rol,
              user.departamento ??
                "",
            ]
              .join(" ")
              .toLowerCase();


            return values.includes(
              normalizedSearch
            );
          }
        );
      },
      [
        users,
        search,
        statusFilter,
      ]
    );


  function handleFieldChange(
    field:
      keyof UserFormState,
    value: string
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }


  function openCreateForm() {
    setEditingUser(null);

    setForm(
      EMPTY_FORM
    );

    setFormError("");

    setSuccess("");

    setShowForm(true);
  }


  function openEditForm(
    selectedUser:
      ManagedUser
  ) {
    setEditingUser(
      selectedUser
    );

    setForm({
      nombre:
        selectedUser.nombre,

      apellido:
        selectedUser.apellido,

      email:
        selectedUser.email,

      password: "",

      idRol:
        String(
          selectedUser.id_rol
        ),

      idDepartamento:
        selectedUser
          .id_departamento
          ? String(
              selectedUser
                .id_departamento
            )
          : "",
    });

    setFormError("");

    setSuccess("");

    setShowForm(true);
  }


  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);

    setEditingUser(null);

    setForm(
      EMPTY_FORM
    );

    setFormError("");
  }


  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");
    setSuccess("");


    const nombre =
      form.nombre.trim();

    const apellido =
      form.apellido.trim();

    const email =
      form.email
        .trim()
        .toLowerCase();

    const idRol =
      Number(
        form.idRol
      );


    if (
      !nombre ||
      !apellido ||
      !email
    ) {
      setFormError(
        "Nombre, apellido y correo electrónico son obligatorios."
      );

      return;
    }


    if (
      !Number.isInteger(
        idRol
      ) ||
      idRol <= 0
    ) {
      setFormError(
        "Debes seleccionar un rol."
      );

      return;
    }


    const idDepartamento =
      form.idDepartamento
        ? Number(
            form.idDepartamento
          )
        : null;


    if (
      idDepartamento !== null &&
      (
        !Number.isInteger(
          idDepartamento
        ) ||
        idDepartamento <= 0
      )
    ) {
      setFormError(
        "Departamento inválido."
      );

      return;
    }


    if (
      !editingUser &&
      form.password.length < 8
    ) {
      setFormError(
        "La contraseña debe tener al menos 8 caracteres."
      );

      return;
    }


    try {
      setSaving(true);


      if (
        editingUser
      ) {
        await updateUser(
          editingUser
            .id_usuario,
          {
            nombre,
            apellido,
            email,
            idRol,
            idDepartamento,
          }
        );

        setSuccess(
          "Usuario actualizado correctamente."
        );

      } else {
        await createUser({
          nombre,
          apellido,
          email,

          password:
            form.password,

          idRol,
          idDepartamento,
        });

        setSuccess(
          "Usuario creado correctamente."
        );
      }


      setShowForm(false);

      setEditingUser(null);

      setForm(
        EMPTY_FORM
      );

      await loadData();

    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el usuario."
      );
    } finally {
      setSaving(false);
    }
  }


  async function handleDeactivate(
    selectedUser:
      ManagedUser
  ) {
    if (
      selectedUser
        .id_usuario ===
      currentUser?.idUsuario
    ) {
      setError(
        "No puedes desactivar tu propio usuario."
      );

      return;
    }


    const confirmed =
      window.confirm(
        `¿Deseas desactivar a ${selectedUser.nombre} ${selectedUser.apellido}?`
      );


    if (!confirmed) {
      return;
    }


    try {
      setDeactivatingId(
        selectedUser
          .id_usuario
      );

      setError("");
      setSuccess("");

      const response =
        await deactivateUser(
          selectedUser
            .id_usuario
        );

      setSuccess(
        response.message
      );

      await loadData();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible desactivar el usuario."
      );
    } finally {
      setDeactivatingId(
        null
      );
    }
  }


  async function handleActivate(
    selectedUser:
      ManagedUser
  ) {
    const confirmed =
      window.confirm(
        `¿Deseas reactivar a ${selectedUser.nombre} ${selectedUser.apellido}?`
      );


    if (!confirmed) {
      return;
    }


    try {
      setActivatingId(
        selectedUser
          .id_usuario
      );

      setError("");
      setSuccess("");

      const response =
        await activateUser(
          selectedUser
            .id_usuario
        );

      setSuccess(
        response.message
      );

      await loadData();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible reactivar el usuario."
      );
    } finally {
      setActivatingId(
        null
      );
    }
  }


  return (
    <div className="users-page">

      <div className="users-page-header">

        <div>
          <h1>
            Gestión de Usuarios
          </h1>

          <p>
            Administración de cuentas,
            roles y departamentos del
            sistema municipal.
          </p>
        </div>


        <button
          type="button"
          className="users-primary-button"
          onClick={
            openCreateForm
          }
        >
          Nuevo usuario
        </button>

      </div>


      <div className="users-summary">

        <article className="users-summary-card">
          <span>
            Total usuarios
          </span>

          <strong>
            {statistics.total}
          </strong>
        </article>


        <article className="users-summary-card">
          <span>
            Activos
          </span>

          <strong>
            {statistics.activos}
          </strong>
        </article>


        <article className="users-summary-card">
          <span>
            Inactivos
          </span>

          <strong>
            {statistics.inactivos}
          </strong>
        </article>


        <article className="users-summary-card">
          <span>
            Departamentos
          </span>

          <strong>
            {
              statistics
                .departamentos
            }
          </strong>
        </article>

      </div>


      {success && (
        <div className="users-success">
          {success}
        </div>
      )}


      {error && (
        <div className="users-error">
          {error}
        </div>
      )}


      <section className="users-card">

        <div className="users-toolbar">

          <input
            type="search"
            placeholder="Buscar por nombre, correo, rol o departamento..."
            value={
              search
            }
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />


          <select
            value={
              statusFilter
            }
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as
                  | "TODOS"
                  | "ACTIVOS"
                  | "INACTIVOS"
              )
            }
          >
            <option value="TODOS">
              Todos los estados
            </option>

            <option value="ACTIVOS">
              Activos
            </option>

            <option value="INACTIVOS">
              Inactivos
            </option>
          </select>

        </div>


        {loading ? (
          <div className="users-message">
            Cargando usuarios...
          </div>

        ) : filteredUsers.length ===
          0 ? (
          <div className="users-empty">

            <strong>
              Sin resultados
            </strong>

            <span>
              No existen usuarios que
              coincidan con los filtros
              seleccionados.
            </span>

          </div>

        ) : (
          <div className="users-table-wrapper">

            <table className="users-table">

              <thead>
                <tr>
                  <th>
                    Usuario
                  </th>

                  <th>
                    Rol
                  </th>

                  <th>
                    Departamento
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Creación
                  </th>

                  <th>
                    Acciones
                  </th>
                </tr>
              </thead>


              <tbody>

                {filteredUsers.map(
                  (managedUser) => (
                    <tr
                      key={
                        managedUser
                          .id_usuario
                      }
                    >

                      <td>

                        <div className="users-user-cell">

                          <strong>
                            {
                              managedUser
                                .nombre
                            }{" "}
                            {
                              managedUser
                                .apellido
                            }
                          </strong>

                          <span>
                            {
                              managedUser
                                .email
                            }
                          </span>

                        </div>

                      </td>


                      <td>
                        {formatRole(
                          managedUser
                            .rol
                        )}
                      </td>


                      <td>
                        {
                          managedUser
                            .departamento ??
                          "Sin departamento"
                        }
                      </td>


                      <td>

                        <span
                          className={
                            managedUser
                              .activo
                              ? "users-status users-status-active"
                              : "users-status users-status-inactive"
                          }
                        >
                          {managedUser
                            .activo
                            ? "Activo"
                            : "Inactivo"}
                        </span>

                      </td>


                      <td>
                        {formatDate(
                          managedUser
                            .fecha_creacion
                        )}
                      </td>


                      <td>

                        <div className="users-actions">

                          <button
                            type="button"
                            className="users-action-edit"
                            onClick={() =>
                              openEditForm(
                                managedUser
                              )
                            }
                          >
                            Editar
                          </button>


                          {managedUser.activo ? (
                            <button
                              type="button"
                              className="users-action-deactivate"
                              disabled={
                                managedUser.id_usuario ===
                                  currentUser?.idUsuario ||
                                deactivatingId ===
                                  managedUser.id_usuario
                              }
                              onClick={() =>
                                handleDeactivate(
                                  managedUser
                                )
                              }
                            >
                              {deactivatingId ===
                              managedUser.id_usuario
                                ? "Desactivando..."
                                : "Desactivar"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="users-action-edit"
                              disabled={
                                activatingId ===
                                managedUser.id_usuario
                              }
                              onClick={() =>
                                handleActivate(
                                  managedUser
                                )
                              }
                            >
                              {activatingId ===
                              managedUser.id_usuario
                                ? "Reactivando..."
                                : "Reactivar"}
                            </button>
                          )}

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>


      {showForm && (
        <div
          className="users-modal-backdrop"
          onMouseDown={
            closeForm
          }
        >

          <div
            className="users-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="users-modal-header">

              <div>
                <h2>
                  {editingUser
                    ? "Editar usuario"
                    : "Nuevo usuario"}
                </h2>

                <p>
                  {editingUser
                    ? "Actualiza la información, rol o departamento de la cuenta."
                    : "Registra una nueva cuenta para acceder a la plataforma."}
                </p>
              </div>


              <button
                type="button"
                className="users-modal-close"
                onClick={
                  closeForm
                }
                disabled={
                  saving
                }
              >
                ×
              </button>

            </div>


            <form
              className="users-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="users-form-row">

                <div className="users-form-field">

                  <label htmlFor="user-name">
                    Nombre
                  </label>

                  <input
                    id="user-name"
                    type="text"
                    value={
                      form.nombre
                    }
                    onChange={(event) =>
                      handleFieldChange(
                        "nombre",
                        event.target
                          .value
                      )
                    }
                    disabled={
                      saving
                    }
                  />

                </div>


                <div className="users-form-field">

                  <label htmlFor="user-lastname">
                    Apellido
                  </label>

                  <input
                    id="user-lastname"
                    type="text"
                    value={
                      form.apellido
                    }
                    onChange={(event) =>
                      handleFieldChange(
                        "apellido",
                        event.target
                          .value
                      )
                    }
                    disabled={
                      saving
                    }
                  />

                </div>

              </div>


              <div className="users-form-field">

                <label htmlFor="user-email">
                  Correo electrónico
                </label>

                <input
                  id="user-email"
                  type="email"
                  value={
                    form.email
                  }
                  onChange={(event) =>
                    handleFieldChange(
                      "email",
                      event.target.value
                    )
                  }
                  disabled={
                    saving
                  }
                />

              </div>


              {!editingUser && (
                <div className="users-form-field">

                  <label htmlFor="user-password">
                    Contraseña
                  </label>

                  <input
                    id="user-password"
                    type="password"
                    value={
                      form.password
                    }
                    onChange={(event) =>
                      handleFieldChange(
                        "password",
                        event.target
                          .value
                      )
                    }
                    disabled={
                      saving
                    }
                    autoComplete="new-password"
                  />

                  <span className="users-field-help">
                    Mínimo 8 caracteres.
                  </span>

                </div>
              )}


              <div className="users-form-row">

                <div className="users-form-field">

                  <label htmlFor="user-role">
                    Rol
                  </label>

                  <select
                    id="user-role"
                    value={
                      form.idRol
                    }
                    onChange={(event) =>
                      handleFieldChange(
                        "idRol",
                        event.target
                          .value
                      )
                    }
                    disabled={
                      saving
                    }
                  >

                    <option value="">
                      Seleccionar rol
                    </option>

                    {roles.map(
                      (role) => (
                        <option
                          key={
                            role.id_rol
                          }
                          value={
                            role.id_rol
                          }
                        >
                          {formatRole(
                            role.nombre
                          )}
                        </option>
                      )
                    )}

                  </select>

                </div>


                <div className="users-form-field">

                  <label htmlFor="user-department">
                    Departamento
                  </label>

                  <select
                    id="user-department"
                    value={
                      form.idDepartamento
                    }
                    onChange={(event) =>
                      handleFieldChange(
                        "idDepartamento",
                        event.target
                          .value
                      )
                    }
                    disabled={
                      saving
                    }
                  >

                    <option value="">
                      Sin departamento
                    </option>

                    {departments.map(
                      (department) => (
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
                            department
                              .nombre
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>


              {formError && (
                <div className="users-form-error">
                  {formError}
                </div>
              )}


              <div className="users-modal-actions">

                <button
                  type="button"
                  className="users-secondary-button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  className="users-primary-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Guardando..."
                    : editingUser
                      ? "Guardar cambios"
                      : "Crear usuario"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
