import {
  NavLink,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  {
    label: "Panel de Control",
    path: "/dashboard",
    icon: "▦",
    roles: [
      "ADMINISTRADOR_MUNICIPAL",
      "ENLACE_MUNICIPAL",
      "DIRECTOR_AREA",
    ],
  },
  {
    label: "Solicitudes SIA",
    path: "/sia",
    icon: "◫",
  },
  {
    label: "Transparencia Activa",
    path: "/transparency",
    icon: "▤",
  },
  {
    label: "Usuarios",
    path: "/users",
    icon: "♙",
    roles: [
      "ADMINISTRADOR_MUNICIPAL",
    ],
  },
  {
    label: "Notificaciones",
    path: "/notifications",
    icon: "♢",
  },
];

export default function Sidebar() {
  const { user } = useAuth();

  const visibleItems =
    menuItems.filter((item) => {
      if (!item.roles) {
        return true;
      }

      return (
        user &&
        item.roles.includes(user.rol)
      );
    });

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          M
        </div>

        <div>
          <strong>
            Municipalidad
          </strong>

          <span>
            Transparencia
          </span>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-section-title">
          MENÚ PRINCIPAL
        </span>

        <nav className="sidebar-nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({
                isActive,
              }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >
              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <span>
          Sistema Municipal
        </span>

        <small>
          Transparencia y SIA
        </small>
      </div>
    </aside>
  );
}
