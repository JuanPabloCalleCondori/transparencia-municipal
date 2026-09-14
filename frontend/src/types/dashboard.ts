export interface DashboardSiaSummary {
  totalSolicitudes: number;
  solicitudesPendientes: number;
  solicitudesVencidas: number;
  solicitudesFinalizadas: number;
  tasaCumplimiento: number;
  tiempoPromedioRespuesta: number;
}

export interface DashboardTransparencySummary {
  totalCargas: number;
  pendientes: number;
  cargadas: number;
  enRevision: number;
  aprobadas: number;
  rechazadas: number;
  publicadas: number;
}

export interface RequestsByState {
  estado: string;
  total: number;
}

export interface RequestsByDepartment {
  id_departamento: number;
  departamento: string;
  total: number;
}

export interface TransparencyByState {
  estado: string;
  total: number;
}

export interface DashboardSummary {
  sia: DashboardSiaSummary;
  transparencia: DashboardTransparencySummary;
  solicitudesPorEstado: RequestsByState[];
  solicitudesPorDepartamento: RequestsByDepartment[];
  transparenciaPorEstado: TransparencyByState[];
}
