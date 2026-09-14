ALTER TABLE notificaciones
DROP CONSTRAINT IF EXISTS chk_tipo_notificacion;

ALTER TABLE notificaciones
ADD CONSTRAINT chk_tipo_notificacion
CHECK (
  tipo IN (
    'INFORMATIVA',
    'ADVERTENCIA',
    'URGENTE',
    'ASIGNACION',
    'PLAZO',
    'RECORDATORIO',
    'TRANSPARENCIA',
    'TAREA'
  )
);