export interface SiaComment {
  id_comentario: number;
  id_solicitud: number;
  id_usuario: number;

  contenido: string;
  fecha_creacion: string;

  nombre: string;
  apellido: string;
  email: string;

  rol: string;
  departamento: string | null;
}


export interface CommentListResponse {
  status: string;
  total: number;
  comentarios: SiaComment[];
}


export interface CreateCommentRequest {
  contenido: string;
}


/*
 * El POST devuelve el comentario
 * directamente desde INSERT RETURNING,
 * por lo que todavía no incluye los
 * datos enriquecidos del usuario.
 */
export interface CreatedComment {
  id_comentario: number;
  id_solicitud: number;
  id_usuario: number;
  contenido: string;
  fecha_creacion: string;
}


export interface CreateCommentResponse {
  status: string;
  message: string;
  comentario: CreatedComment;
}