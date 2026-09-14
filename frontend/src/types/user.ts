export interface ManagedUser {
  id_usuario: number;

  nombre: string;
  apellido: string;
  email: string;

  activo: boolean;

  fecha_creacion: string;

  id_rol: number;
  rol: string;

  id_departamento:
    number | null;

  departamento:
    string | null;
}


export interface UserRoleOption {
  id_rol: number;
  nombre: string;
}


export interface UserDepartmentOption {
  id_departamento: number;
  nombre: string;
}


export interface UserListResponse {
  status: string;
  total: number;

  usuarios: ManagedUser[];
}


export interface UserOptionsResponse {
  status: string;

  roles: UserRoleOption[];

  departamentos:
    UserDepartmentOption[];
}


export interface CreateUserData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;

  idRol: number;

  idDepartamento:
    number | null;
}


export interface UpdateUserData {
  nombre?: string;
  apellido?: string;
  email?: string;

  idRol?: number;

  idDepartamento?:
    number | null;
}


export interface UserMutationResponse {
  status: string;
  message: string;

  usuario: ManagedUser;
}