import {
  apiRequest,
} from "./api";

import type {
  CommentListResponse,
  CreateCommentRequest,
  CreateCommentResponse,
} from "../types/comment";


export async function getSiaComments(
  idSolicitud: number
) {
  return apiRequest<CommentListResponse>(
    `/sia/${idSolicitud}/comments`
  );
}


export async function createSiaComment(
  idSolicitud: number,
  data: CreateCommentRequest
) {
  return apiRequest<CreateCommentResponse>(
    `/sia/${idSolicitud}/comments`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}
