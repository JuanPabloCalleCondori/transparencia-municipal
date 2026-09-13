-- ============================================================
-- SISTEMA MUNICIPAL DE TRANSPARENCIA
-- Esquema inicial de base de datos
-- PostgreSQL
-- ============================================================


-- ============================================================
-- 1. ROLES
-- ============================================================

CREATE TABLE roles (
    id_rol INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. DEPARTAMENTOS
-- ============================================================

CREATE TABLE departamentos (
    id_departamento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. USUARIOS
-- ============================================================

CREATE TABLE usuarios (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    id_rol INTEGER NOT NULL,
    id_departamento INTEGER,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol),

    CONSTRAINT fk_usuario_departamento
        FOREIGN KEY (id_departamento)
        REFERENCES departamentos(id_departamento)
);


-- ============================================================
-- 4. ESTADOS DE SOLICITUD
-- ============================================================

CREATE TABLE estados_solicitud (
    id_estado INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);


-- ============================================================
-- 5. SOLICITUDES SIA
-- ============================================================

CREATE TABLE solicitudes_sia (
    id_solicitud INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    folio VARCHAR(50) NOT NULL UNIQUE,

    nombre_solicitante VARCHAR(150) NOT NULL,
    email_solicitante VARCHAR(150),

    descripcion TEXT NOT NULL,

    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    fecha_cierre DATE,

    id_estado INTEGER NOT NULL,
    id_departamento_responsable INTEGER,
    id_responsable INTEGER,

    tiene_prorroga BOOLEAN NOT NULL DEFAULT FALSE,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_solicitud_estado
        FOREIGN KEY (id_estado)
        REFERENCES estados_solicitud(id_estado),

    CONSTRAINT fk_solicitud_departamento
        FOREIGN KEY (id_departamento_responsable)
        REFERENCES departamentos(id_departamento),

    CONSTRAINT fk_solicitud_responsable
        FOREIGN KEY (id_responsable)
        REFERENCES usuarios(id_usuario),

    CONSTRAINT chk_fecha_vencimiento
        CHECK (fecha_vencimiento >= fecha_ingreso),

    CONSTRAINT chk_fecha_cierre
        CHECK (
            fecha_cierre IS NULL
            OR fecha_cierre >= fecha_ingreso
        )
);


-- ============================================================
-- 6. TAREAS Y SUBTAREAS
-- ============================================================

CREATE TABLE tareas (
    id_tarea INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_solicitud INTEGER NOT NULL,
    id_usuario_asignado INTEGER,

    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,

    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',

    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATE,
    fecha_completada TIMESTAMP,

    CONSTRAINT fk_tarea_solicitud
        FOREIGN KEY (id_solicitud)
        REFERENCES solicitudes_sia(id_solicitud)
        ON DELETE CASCADE,

    CONSTRAINT fk_tarea_usuario
        FOREIGN KEY (id_usuario_asignado)
        REFERENCES usuarios(id_usuario),

    CONSTRAINT chk_estado_tarea
        CHECK (
            estado IN (
                'PENDIENTE',
                'EN_PROCESO',
                'COMPLETADA',
                'CANCELADA'
            )
        )
);


-- ============================================================
-- 7. DOCUMENTOS DE SOLICITUDES
-- ============================================================

CREATE TABLE documentos (
    id_documento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_solicitud INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,

    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tipo_documento VARCHAR(100),

    fecha_subida TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_documento_solicitud
        FOREIGN KEY (id_solicitud)
        REFERENCES solicitudes_sia(id_solicitud)
        ON DELETE CASCADE,

    CONSTRAINT fk_documento_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
);


-- ============================================================
-- 8. COMENTARIOS INTERNOS
-- ============================================================

CREATE TABLE comentarios (
    id_comentario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_solicitud INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,

    contenido TEXT NOT NULL,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comentario_solicitud
        FOREIGN KEY (id_solicitud)
        REFERENCES solicitudes_sia(id_solicitud)
        ON DELETE CASCADE,

    CONSTRAINT fk_comentario_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
);


-- ============================================================
-- 9. PRÓRROGAS
-- ============================================================

CREATE TABLE prorrogas (
    id_prorroga INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_solicitud INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,

    motivo TEXT NOT NULL,

    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dias_prorroga INTEGER NOT NULL DEFAULT 10,

    aprobada BOOLEAN,
    fecha_resolucion TIMESTAMP,

    CONSTRAINT fk_prorroga_solicitud
        FOREIGN KEY (id_solicitud)
        REFERENCES solicitudes_sia(id_solicitud)
        ON DELETE CASCADE,

    CONSTRAINT fk_prorroga_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario),

    CONSTRAINT chk_dias_prorroga
        CHECK (dias_prorroga > 0)
);


-- ============================================================
-- 10. ÍTEMS DE TRANSPARENCIA ACTIVA
-- ============================================================

CREATE TABLE items_transparencia (
    id_item INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,

    id_departamento_responsable INTEGER NOT NULL,

    periodicidad VARCHAR(30) NOT NULL DEFAULT 'MENSUAL',

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_item_departamento
        FOREIGN KEY (id_departamento_responsable)
        REFERENCES departamentos(id_departamento),

    CONSTRAINT chk_periodicidad
        CHECK (
            periodicidad IN (
                'MENSUAL',
                'TRIMESTRAL',
                'SEMESTRAL',
                'ANUAL'
            )
        )
);


-- ============================================================
-- 11. CARGAS DE TRANSPARENCIA ACTIVA
-- ============================================================

CREATE TABLE cargas_transparencia (
    id_carga INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_item INTEGER NOT NULL,
    id_usuario_responsable INTEGER NOT NULL,
    id_usuario_validador INTEGER,

    periodo DATE NOT NULL,

    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',

    nombre_archivo VARCHAR(255),
    ruta_archivo VARCHAR(500),

    observacion TEXT,

    fecha_carga TIMESTAMP,
    fecha_validacion TIMESTAMP,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_carga_item
        FOREIGN KEY (id_item)
        REFERENCES items_transparencia(id_item),

    CONSTRAINT fk_carga_responsable
        FOREIGN KEY (id_usuario_responsable)
        REFERENCES usuarios(id_usuario),

    CONSTRAINT fk_carga_validador
        FOREIGN KEY (id_usuario_validador)
        REFERENCES usuarios(id_usuario),

    CONSTRAINT chk_estado_carga
        CHECK (
            estado IN (
                'PENDIENTE',
                'CARGADO',
                'EN_REVISION',
                'APROBADO',
                'RECHAZADO',
                'PUBLICADO'
            )
        ),

    CONSTRAINT uq_item_periodo
        UNIQUE (id_item, periodo)
);


-- ============================================================
-- 12. NOTIFICACIONES
-- ============================================================

CREATE TABLE notificaciones (
    id_notificacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_usuario INTEGER NOT NULL,

    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,

    tipo VARCHAR(30) NOT NULL DEFAULT 'INFORMATIVA',

    leida BOOLEAN NOT NULL DEFAULT FALSE,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMP,

    CONSTRAINT fk_notificacion_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT chk_tipo_notificacion
        CHECK (
            tipo IN (
                'INFORMATIVA',
                'ADVERTENCIA',
                'URGENTE'
            )
        )
);


-- ============================================================
-- 13. AUDITORÍA
-- ============================================================

CREATE TABLE auditoria (
    id_auditoria BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_usuario INTEGER,

    entidad VARCHAR(100) NOT NULL,
    id_registro INTEGER,

    accion VARCHAR(50) NOT NULL,
    descripcion TEXT,

    datos_anteriores JSONB,
    datos_nuevos JSONB,

    ip_origen VARCHAR(45),

    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
);
