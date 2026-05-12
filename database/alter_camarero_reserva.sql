-- Añade la columna id_camarero a la tabla reservas
-- Ejecutar en phpMyAdmin sobre la base de datos restaurante_tfg

ALTER TABLE reservas
    ADD COLUMN id_camarero INT NULL AFTER numero_mesa,
    ADD CONSTRAINT fk_reservas_camarero
        FOREIGN KEY (id_camarero) REFERENCES usuarios (id_usuario)
        ON DELETE SET NULL;
