export interface User {
  idUsuario: number;
  email: string;
  rol: string;
  nombre?: string;
  apellido?: string;
}

export interface LoginResponse {
  status: string;
  message?: string;
  token: string;
  usuario?: User;
}
