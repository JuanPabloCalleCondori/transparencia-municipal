ALTER TABLE tareas
ADD COLUMN id_tarea_padre INTEGER NULL;

ALTER TABLE tareas
ADD CONSTRAINT fk_tarea_padre
FOREIGN KEY (id_tarea_padre)
REFERENCES tareas(id_tarea)
ON DELETE CASCADE;

CREATE INDEX idx_tareas_solicitud
ON tareas(id_solicitud);

CREATE INDEX idx_tareas_padre
ON tareas(id_tarea_padre);

CREATE INDEX idx_tareas_usuario
ON tareas(id_usuario_asignado);
