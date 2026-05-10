-- añado la columna numero_mesa a la tabla reservas
-- es nullable porque al crear la reserva aún no se sabe qué mesa se va a asignar
ALTER TABLE reservas ADD COLUMN numero_mesa INT NULL AFTER estado;
