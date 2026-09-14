ALTER TABLE comentarios
ADD COLUMN IF NOT EXISTS contenido TEXT;

ALTER TABLE comentarios
ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP
DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_comentarios_solicitud
ON comentarios(id_solicitud);

CREATE INDEX IF NOT EXISTS idx_comentarios_usuario
ON comentarios(id_usuario);
