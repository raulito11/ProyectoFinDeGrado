-- ============================================================
-- Migración: tabla horarios_empleados
-- Asignación diaria de turno o descanso para cada empleado
-- Ejecutar en phpMyAdmin o consola MySQL
-- ============================================================

USE restaurante_tfg;

CREATE TABLE IF NOT EXISTS horarios_empleados (
    id           INT      NOT NULL AUTO_INCREMENT,
    empleado_id  INT      NOT NULL COMMENT 'FK a usuarios (camarero o jefe_sala)',
    fecha        DATE     NOT NULL COMMENT 'Día concreto de la asignación',
    estado       ENUM('trabajo','libre') NOT NULL DEFAULT 'trabajo',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_empleado_fecha (empleado_id, fecha),
    CONSTRAINT fk_he_usuario
        FOREIGN KEY (empleado_id) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
