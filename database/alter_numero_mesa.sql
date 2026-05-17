-- Añade la columna numero_mesa a la tabla reservas.
-- Es nullable porque al crear la reserva aún no se sabe qué mesa se asignará.
-- Ejecutar en phpMyAdmin sobre la base de datos restaurante_tfg.

USE restaurante_tfg;

ALTER TABLE reservas ADD COLUMN numero_mesa INT NULL AFTER estado;
