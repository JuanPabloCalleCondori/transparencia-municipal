import {
  type FormEvent,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  createSiaRequest,
} from "../../api/sia.api";


interface FormData {
  nombre_solicitante: string;
  email_solicitante: string;
  descripcion: string;
}


const initialForm: FormData = {
  nombre_solicitante: "",
  email_solicitante: "",
  descripcion: "",
};


export default function SiaCreatePage() {
  const navigate =
    useNavigate();

  const [form, setForm] =
    useState<FormData>(
      initialForm
    );

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);


  function handleChange(
    event:
      React.ChangeEvent<
        HTMLInputElement |
        HTMLTextAreaElement
      >
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }


  function validateForm() {
    if (
      !form.nombre_solicitante.trim()
    ) {
      return "Debes ingresar el nombre del solicitante.";
    }

    if (
      !form.email_solicitante.trim()
    ) {
      return "Debes ingresar el correo electrónico del solicitante.";
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        form.email_solicitante.trim()
      )
    ) {
      return "El correo electrónico ingresado no es válido.";
    }

    if (
      form.descripcion
        .trim()
        .length < 10
    ) {
      return "La solicitud debe contener una descripción de al menos 10 caracteres.";
    }

    return null;
  }


  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }

    try {
      setSubmitting(true);

      const response = await createSiaRequest({
          nombreSolicitante:
              form.nombre_solicitante.trim(),

          emailSolicitante:
              form.email_solicitante
          .trim()
          .toLowerCase(),

          descripcion:
              form.descripcion.trim(),
      });

      const folio =
        response.solicitud?.folio;

      setSuccess(
        folio
          ? `Solicitud ${folio} creada correctamente.`
          : "Solicitud creada correctamente."
      );

      setTimeout(() => {
        navigate("/sia");
      }, 1000);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible crear la solicitud."
      );
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>
            Nueva solicitud SIA
          </h1>

          <p>
            Registra una nueva solicitud
            de acceso a la información.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate("/sia")
          }
          disabled={submitting}
        >
          Volver
        </button>
      </div>


      <div className="sia-create-layout">
        <div className="content-card">
          <div className="form-section-heading">
            <h2>
              Datos del solicitante
            </h2>

            <p>
              Ingresa los antecedentes
              asociados a la solicitud.
            </p>
          </div>


          {error && (
            <div className="form-alert form-alert-error">
              {error}
            </div>
          )}


          {success && (
            <div className="form-alert form-alert-success">
              {success}
            </div>
          )}


          <form
            onSubmit={
              handleSubmit
            }
            className="sia-form"
          >
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="nombre_solicitante">
                  Nombre completo
                  <span>*</span>
                </label>

                <input
                  id="nombre_solicitante"
                  name="nombre_solicitante"
                  type="text"
                  value={
                    form.nombre_solicitante
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Ej: María González"
                  maxLength={150}
                  disabled={
                    submitting
                  }
                  autoComplete="name"
                />
              </div>


              <div className="form-field">
                <label htmlFor="email_solicitante">
                  Correo electrónico
                  <span>*</span>
                </label>

                <input
                  id="email_solicitante"
                  name="email_solicitante"
                  type="email"
                  value={
                    form.email_solicitante
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Ej: maria@email.cl"
                  maxLength={150}
                  disabled={
                    submitting
                  }
                  autoComplete="email"
                />
              </div>
            </div>


            <div className="form-field">
              <label htmlFor="descripcion">
                Descripción de la solicitud
                <span>*</span>
              </label>

              <textarea
                id="descripcion"
                name="descripcion"
                value={
                  form.descripcion
                }
                onChange={
                  handleChange
                }
                placeholder="Describe claramente la información solicitada..."
                rows={8}
                maxLength={3000}
                disabled={
                  submitting
                }
              />

              <div className="form-field-footer">
                <span>
                  Mínimo 10 caracteres
                </span>

                <span>
                  {
                    form.descripcion
                      .length
                  }
                  /3000
                </span>
              </div>
            </div>


            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  navigate("/sia")
                }
                disabled={
                  submitting
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  submitting
                }
              >
                {submitting
                  ? "Registrando..."
                  : "Registrar solicitud"}
              </button>
            </div>
          </form>
        </div>


        <aside className="sia-info-card">
          <h3>
            Registro SIA
          </h3>

          <p>
            Al registrar la solicitud,
            el sistema generará
            automáticamente su folio y
            fecha de vencimiento.
          </p>

          <div className="sia-info-item">
            <span>
              Estado inicial
            </span>

            <strong>
              INGRESADA
            </strong>
          </div>

          <div className="sia-info-item">
            <span>
              Plazo inicial
            </span>

            <strong>
              20 días hábiles
            </strong>
          </div>

          <div className="sia-info-item">
            <span>
              Folio
            </span>

            <strong>
              Automático
            </strong>
          </div>
        </aside>
      </div>
    </section>
  );
}