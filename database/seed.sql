-- ============================================================
-- SISTEMA MUNICIPAL DE TRANSPARENCIA
-- Datos iniciales
-- PostgreSQL
-- ============================================================


-- ============================================================
-- 1. ROLES
-- ============================================================

INSERT INTO roles (nombre, descripcion)
VALUES
(
    'ADMINISTRADOR_MUNICIPAL',
    'Administración general de la plataforma'
),
(
    'ENLACE_MUNICIPAL',
    'Supervisión global de los procesos de transparencia'
),
(
    'DIRECTOR_AREA',
    'Validación y supervisión de solicitudes de su departamento'
),
(
    'FUNCIONARIO_OPERATIVO',
    'Gestión operativa de solicitudes, tareas y documentos'
);


-- ============================================================
-- 2. DEPARTAMENTOS
-- ============================================================

INSERT INTO departamentos (nombre, descripcion)
VALUES
(
    'Administración Municipal',
    'Unidad responsable de la administración general municipal'
),
(
    'Dirección Jurídica',
    'Unidad responsable de materias jurídicas y procesos de validación'
),
(
    'Recursos Humanos',
    'Unidad responsable de la gestión del personal municipal'
),
(
    'Finanzas',
    'Unidad responsable de materias financieras y presupuestarias'
),
(
    'Obras Municipales',
    'Unidad responsable de materias relacionadas con obras municipales'
),
(
    'Desarrollo Comunitario',
    'Unidad responsable de programas y servicios dirigidos a la comunidad'
),
(
    'Tránsito',
    'Unidad responsable de materias relacionadas con tránsito y permisos'
),
(
    'Medio Ambiente',
    'Unidad responsable de materias ambientales'
),
(
    'Informática',
    'Unidad responsable de infraestructura y soporte tecnológico'
);


-- ============================================================
-- 3. ESTADOS DE SOLICITUDES SIA
-- ============================================================

INSERT INTO estados_solicitud (nombre, descripcion)
VALUES
(
    'INGRESADA',
    'Solicitud registrada y pendiente de asignación'
),
(
    'ASIGNADA',
    'Solicitud asignada a un departamento o funcionario responsable'
),
(
    'EN_PROCESO',
    'Solicitud actualmente en gestión'
),
(
    'EN_REVISION',
    'Respuesta preparada y pendiente de revisión'
),
(
    'FINALIZADA',
    'Solicitud respondida y proceso finalizado'
),
(
    'VENCIDA',
    'Solicitud que superó su fecha límite de respuesta'
),
(
    'CANCELADA',
    'Solicitud cuyo proceso fue cancelado'
);
