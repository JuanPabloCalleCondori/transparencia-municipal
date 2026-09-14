CREATE OR REPLACE FUNCTION impedir_modificacion_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'Los registros de auditoría son inmutables';
END;
$$;

CREATE TRIGGER trg_auditoria_no_update
BEFORE UPDATE ON auditoria
FOR EACH ROW
EXECUTE FUNCTION impedir_modificacion_auditoria();

CREATE TRIGGER trg_auditoria_no_delete
BEFORE DELETE ON auditoria
FOR EACH ROW
EXECUTE FUNCTION impedir_modificacion_auditoria();
