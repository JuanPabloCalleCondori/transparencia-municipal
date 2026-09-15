import {
  useState,
  type FormEvent,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import type {
  User,
} from "../types/auth";


function getHomeRoute(
  user: User
) {
  if (
    user.rol ===
    "FUNCIONARIO_OPERATIVO"
  ) {
    return "/sia";
  }

  return "/dashboard";
}


export default function LoginPage() {
  const {
    login,
    user,
    isAuthenticated,
  } = useAuth();

  const navigate =
    useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  /*
   * Si el usuario ya posee
   * una sesión activa, lo enviamos
   * a la página inicial permitida
   * para su rol.
   */
  if (
    isAuthenticated &&
    user
  ) {
    return (
      <Navigate
        to={getHomeRoute(user)}
        replace
      />
    );
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      /*
       * login devuelve el usuario
       * autenticado obtenido desde /me.
       */
      const authenticatedUser =
        await login(
          email.trim(),
          password
        );

      navigate(
        getHomeRoute(
          authenticatedUser
        ),
        {
          replace: true,
        }
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="login-page">
      <section className="login-card">

        <div className="login-header">
          <div className="login-logo">
            M
          </div>

          <div>
            <p className="login-eyebrow">
              Plataforma Municipal
            </p>

            <h1>
              Transparencia y SIA
            </h1>
          </div>
        </div>


        <p className="login-description">
          Ingresa tus credenciales para
          acceder al sistema de gestión
          municipal.
        </p>


        <form
          onSubmit={handleSubmit}
          className="login-form"
        >
          <label>
            Correo electrónico

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="usuario@municipalidad.cl"
              autoComplete="email"
              required
            />
          </label>


          <label>
            Contraseña

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>


          {error && (
            <div
              className="login-error"
              role="alert"
            >
              {error}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Ingresando..."
              : "Iniciar sesión"}
          </button>

        </form>
      </section>
    </main>
  );
}