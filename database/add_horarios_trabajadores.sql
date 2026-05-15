-- ============================================================
-- Migración: tabla horarios_trabajadores
-- Jornada semanal de cada empleado (40h, 5 días trabajo, 2 descanso)
-- Ejecutar después de schema.sql
-- ============================================================

USE restaurante_tfg;

CREATE TABLE IF NOT EXISTS horarios_trabajadores (
    id_horario_trabajador  INT          NOT NULL AUTO_INCREMENT,
    id_usuario             INT          NOT NULL COMMENT 'FK al trabajador (camarero o jefe_sala)',
    semana_inicio          DATE         NOT NULL COMMENT 'Lunes de la semana (YYYY-MM-DD)',
    dias_trabajo           TEXT         NOT NULL COMMENT 'JSON: ["Lunes","Martes",...]  — siempre 5 días',
    dias_descanso          TEXT         NOT NULL COMMENT 'JSON: ["Sábado","Domingo"]   — siempre 2 días',
    horas_por_dia          TINYINT      NOT NULL DEFAULT 8 COMMENT 'Fijo: 8 h/día → 40 h/semana',

    PRIMARY KEY (id_horario_trabajador),
    UNIQUE KEY uq_trabajador_semana (id_usuario, semana_inicio),
    CONSTRAINT fk_htrab_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
