/* =========================================================
   MIGRACIÓN 006
   Módulo de Transparencia Activa
   ========================================================= */


/*
 * Fecha en que una carga aprobada
 * fue publicada.
 */
ALTER TABLE cargas_transparencia
ADD COLUMN IF NOT EXISTS fecha_publicacion TIMESTAMP;


/*
 * Evita crear dos cargas para
 * el mismo ítem y período.
 */
CREATE UNIQUE INDEX IF NOT EXISTS
uq_cargas_item_periodo
ON cargas_transparencia (
    id_item,
    periodo
);


/*
 * Índices para consultas frecuentes.
 */
CREATE INDEX IF NOT EXISTS
idx_cargas_estado
ON cargas_transparencia(estado);


CREATE INDEX IF NOT EXISTS
idx_cargas_responsable
ON cargas_transparencia(
    id_usuario_responsable
);


CREATE INDEX IF NOT EXISTS
idx_items_departamento
ON items_transparencia(
    id_departamento_responsable
);


/*
 * Restricción de estados válidos.
 */
ALTER TABLE cargas_transparencia
DROP CONSTRAINT IF EXISTS
chk_cargas_transparencia_estado;


ALTER TABLE cargas_transparencia
ADD CONSTRAINT
chk_cargas_transparencia_estado
CHECK (
    estado IN (
        'PENDIENTE',
        'CARGADO',
        'EN_REVISION',
        'APROBADO',
        'RECHAZADO',
        'PUBLICADO'
    )
);