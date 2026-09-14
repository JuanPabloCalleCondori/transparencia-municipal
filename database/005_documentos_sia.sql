ALTER TABLE documentos
ADD COLUMN IF NOT EXISTS nombre_original VARCHAR(255);

ALTER TABLE documentos
ADD COLUMN IF NOT EXISTS nombre_almacenado VARCHAR(255);

ALTER TABLE documentos
ADD COLUMN IF NOT EXISTS ruta_archivo TEXT;

ALTER TABLE documentos
ADD COLUMN IF NOT EXISTS tipo_mime VARCHAR(150);

ALTER TABLE documentos
ADD COLUMN IF NOT EXISTS tamano_bytes BIGINT;

ALTER TABLE documentos
ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP
DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_documentos_solicitud
ON documentos(id_solicitud);

CREATE INDEX IF NOT EXISTS idx_documentos_usuario
ON documentos(id_usuario);
