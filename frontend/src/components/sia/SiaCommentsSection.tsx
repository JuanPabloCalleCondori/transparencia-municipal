import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createSiaComment,
  getSiaComments,
} from "../../api/comment.api";

import type {
  SiaComment,
} from "../../types/comment";

import "./SiaCommentsSection.css";


interface Props {
  idSolicitud: number;
  closed?: boolean;
}


function formatRole(
  role: string
) {
  return role.replaceAll(
    "_",
    " "
  );
}


function formatDateTime(
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
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}


function getInitials(
  comment: SiaComment
) {
  const first =
    comment.nombre
      ?.trim()
      .charAt(0) ?? "";

  const second =
    comment.apellido
      ?.trim()
      .charAt(0) ?? "";

  return (
    `${first}${second}`
      .toUpperCase() ||
    "U"
  );
}


export default function SiaCommentsSection({
  idSolicitud,
  closed = false,
}: Props) {

  const [
    comments,
    setComments,
  ] = useState<SiaComment[]>(
    []
  );

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

  const [
    content,
    setContent,
  ] = useState("");

  const [
    sending,
    setSending,
  ] = useState(false);

  const commentsEndRef =
    useRef<HTMLDivElement | null>(
      null
    );


  const loadComments =
    useCallback(
      async (
        showLoading = true
      ) => {
        try {
          if (showLoading) {
            setLoading(true);
          }

          setError("");

          const response =
            await getSiaComments(
              idSolicitud
            );

          setComments(
            response.comentarios
          );

        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar los comentarios."
          );
        } finally {
          if (showLoading) {
            setLoading(false);
          }
        }
      },
      [idSolicitud]
    );


  useEffect(() => {
    loadComments();
  }, [loadComments]);


  /*
   * Desplazamos el hilo hacia
   * el comentario más reciente.
   */
  useEffect(() => {
    if (
      comments.length > 0
    ) {
      commentsEndRef.current
        ?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
    }
  }, [comments]);


  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setError("");
      setSuccessMessage("");

      const trimmedContent =
        content.trim();

      if (!trimmedContent) {
        setError(
          "Debes escribir un comentario."
        );

        return;
      }

      setSending(true);

      const response =
        await createSiaComment(
          idSolicitud,
          {
            contenido:
              trimmedContent,
          }
        );

      setContent("");

      /*
       * Volvemos a consultar el GET
       * porque el POST no incluye
       * nombre, apellido, rol ni
       * departamento del autor.
       */
      await loadComments(
        false
      );

      setSuccessMessage(
        response.message ||
          "Comentario registrado correctamente."
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible registrar el comentario."
      );
    } finally {
      setSending(false);
    }
  }


  function handleKeyDown(
    event:
      React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    /*
     * Ctrl + Enter permite enviar
     * rápidamente sin impedir el uso
     * normal de Enter para nuevas líneas.
     */
    if (
      event.key === "Enter" &&
      event.ctrlKey
    ) {
      event.preventDefault();

      event.currentTarget
        .form
        ?.requestSubmit();
    }
  }


  return (
    <section className="sia-comments-section">

      <div className="sia-comments-header">
        <div>
          <h3>
            Coordinación interna
          </h3>

          <p>
            Hilo de comentarios asociado
            a esta solicitud.
          </p>
        </div>

        <div className="sia-comments-count">
          <strong>
            {comments.length}
          </strong>

          <span>
            {comments.length === 1
              ? "comentario"
              : "comentarios"}
          </span>
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


      <div className="sia-comments-thread">

        {loading && (
          <div className="sia-comments-message">
            Cargando comentarios...
          </div>
        )}


        {!loading &&
          comments.length ===
            0 && (
            <div className="sia-comments-empty">
              <strong>
                Sin comentarios internos
              </strong>

              <span>
                Todavía no se han
                registrado mensajes de
                coordinación para esta
                solicitud.
              </span>
            </div>
          )}


        {!loading &&
          comments.map(
            (comment) => (
              <article
                key={
                  comment.id_comentario
                }
                className="sia-comment"
              >
                <div className="sia-comment-avatar">
                  {getInitials(
                    comment
                  )}
                </div>


                <div className="sia-comment-body">

                  <div className="sia-comment-header">
                    <div>
                      <strong>
                        {comment.nombre}{" "}
                        {comment.apellido}
                      </strong>

                      <div className="sia-comment-user-meta">
                        <span>
                          {formatRole(
                            comment.rol
                          )}
                        </span>

                        {comment.departamento && (
                          <>
                            <span
                              className="sia-comment-separator"
                              aria-hidden="true"
                            >
                              •
                            </span>

                            <span>
                              {
                                comment.departamento
                              }
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <time
                      dateTime={
                        comment.fecha_creacion
                      }
                    >
                      {formatDateTime(
                        comment.fecha_creacion
                      )}
                    </time>
                  </div>


                  <p className="sia-comment-content">
                    {comment.contenido}
                  </p>
                </div>
              </article>
            )
          )}

        <div
          ref={commentsEndRef}
        />
      </div>


      {!closed ? (
        <form
          className="sia-comment-form"
          onSubmit={
            handleSubmit
          }
        >
          <label
            htmlFor="sia-comment-content"
          >
            Nuevo comentario
          </label>

          <textarea
            id="sia-comment-content"
            rows={4}
            value={content}
            maxLength={2000}
            disabled={sending}
            placeholder="Escribe un comentario para la coordinación interna de esta solicitud..."
            onChange={(
              event
            ) => {
              setContent(
                event.target.value
              );

              if (error) {
                setError("");
              }

              if (
                successMessage
              ) {
                setSuccessMessage(
                  ""
                );
              }
            }}
            onKeyDown={
              handleKeyDown
            }
          />


          <div className="sia-comment-form-footer">

            <span>
              {content.length}/2000
              {" · "}
              Ctrl + Enter para enviar
            </span>

            <button
              type="submit"
              className="primary-button"
              disabled={
                sending ||
                !content.trim()
              }
            >
              {sending
                ? "Enviando..."
                : "Agregar comentario"}
            </button>
          </div>
        </form>
      ) : (
        <div className="sia-comments-closed">
          La solicitud está cerrada.
          El historial de comentarios
          permanece disponible en modo
          de consulta.
        </div>
      )}
    </section>
  );
}
