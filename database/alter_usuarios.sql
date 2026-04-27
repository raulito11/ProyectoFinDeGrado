-- ============================================================
-- alter_usuarios.sql
-- Añade los campos apellidos y telefono a la tabla usuarios.
-- Ejecutar en phpMyAdmin si ya tienes la base de datos creada
-- y no quieres borrarla y volver a crearla desde schema.sql.
-- ============================================================

USE restaurante_tfg;

ALTER TABLE usuarios
    ADD COLUMN apellidos VARCHAR(150) NOT NULL DEFAULT '' AFTER nombre,
    ADD COLUMN telefono  VARCHAR(20)  NOT NULL DEFAULT '' AFTER apellidos;

-- Actualiza los datos de prueba con valores reales
UPDATE usuarios SET apellidos = 'García López',  telefono = '612345678' WHERE email = 'cliente@restaurante.com';
UPDATE usuarios SET apellidos = 'López Martín',  telefono = '623456789' WHERE email = 'camarero@restaurante.com';
UPDATE usuarios SET apellidos = 'Ruiz Sánchez',  telefono = '634567890' WHERE email = 'jefedesala@restaurante.com';
UPDATE usuarios SET apellidos = 'Admin Torres',  telefono = '645678901' WHERE email = 'admin@restaurante.com';

-- Quita el DEFAULT '' ahora que los datos ya están rellenos
-- (así el campo queda obligatorio como debe ser)
ALTER TABLE usuarios
    MODIFY COLUMN apellidos VARCHAR(150) NOT NULL,
    MODIFY COLUMN telefono  VARCHAR(20)  NOT NULL;
