import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

function formatRole(
  role?: string
) {
  if (!role) {
    return "";
  }

  const roles: Record<
    string,
    string
  > = {
    ADMINISTRADOR_MUNICIPAL:
      "Administrador Municipal",

    ENLACE_MUNICIPAL:
      "Enlace Municipal",

    DIRECTOR_AREA:
      "Director de Área",

    FUNCIONARIO_OPERATIVO:
      "Funcionario Operativo",
  };

  return (
    roles[role] ??
    role.replaceAll("_", " ")
  );
}

export default function Navbar() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  function handleLogout() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }

  const initials =
    user?.nombre
      ? `${user.nombre.charAt(0)}${
          user.apellido?.charAt(0) ??
          ""
        }`.toUpperCase()
      : user?.email
          ?.charAt(0)
          .toUpperCase() ?? "U";

  return (
    <header className="navbar">
      <div>
        <p className="navbar-eyebrow">
          Sistema de Gestión Municipal
        </p>

        <h2>
          Transparencia y SIA
        </h2>
      </div>

      <div className="navbar-user">
        <div className="user-avatar">
          {initials}
        </div>

        <div className="user-information">
          <strong>
            {user?.nombre
              ? `${user.nombre} ${
                  user.apellido ?? ""
                }`
              : user?.email}
          </strong>

          <span>
            {formatRole(
              user?.rol
            )}
          </span>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={
            handleLogout
          }
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
