import {
  useAuth,
} from "../context/AuthContext";

export default function DashboardPage() {
  const {
    user,
    logout,
  } = useAuth();

  return (
    <main
      style={{
        padding: "40px",
      }}
    >
      <h1>
        Panel de Control
      </h1>

      <p>
        Sesión iniciada como{" "}
        <strong>
          {user?.email}
        </strong>
      </p>

      <p>
        Rol:{" "}
        <strong>
          {user?.rol}
        </strong>
      </p>

      <button
        onClick={logout}
      >
        Cerrar sesión
      </button>
    </main>
  );
}
