import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

import SiaListPage from "./pages/sia/SiaListPage";

import SiaCreatePage from "./pages/sia/SiaCreatePage";

import SiaDetailPage from "./pages/sia/SiaDetailPage";


function TemporaryPage({
  title,
}: {
  title: string;
}) {
  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>{title}</h1>

          <p>
            Módulo en construcción.
          </p>
        </div>
      </div>

      <div className="content-card">
        Este módulo será implementado
        en las siguientes etapas.
      </div>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        element={
          <ProtectedRoute />
        }
      >
        <Route
          element={<Layout />}
        >
          <Route
            path="/dashboard"
            element={
              <DashboardPage />
            }
          />

          <Route
            path="/sia"
            element={<SiaListPage />}
          />
          
          <Route
            path="/sia/new"
            element={<SiaCreatePage />}
          />

          <Route
            path="/sia/:id"
            element={<SiaDetailPage />}
          />

          <Route
            path="/transparency"
            element={
              <TemporaryPage
                title="Transparencia Activa"
              />
            }
          />

          <Route
            path="/users"
            element={
              <TemporaryPage
                title="Gestión de Usuarios"
              />
            }
          />

          <Route
            path="/notifications"
            element={
              <TemporaryPage
                title="Notificaciones"
              />
            }
          />
        </Route>
      </Route>

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}
