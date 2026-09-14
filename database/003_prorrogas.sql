ALTER TABLE prorrogas
ADD COLUMN numero_resolucion VARCHAR(100);

CREATE INDEX idx_prorrogas_solicitud
ON prorrogas(id_solicitud);
