-- ============================================================
-- TFG Restaurante - Esquema de base de datos
-- Autor: Raúl García Manotas — DAW 2º curso
-- Descripcion: Sistema de reservas para restaurante El Olivo
-- ============================================================

CREATE DATABASE IF NOT EXISTS restaurante_tfg
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE restaurante_tfg;

-- ============================================================
-- 1. ROLES
-- Define los tipos de usuario del sistema
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id_rol  INT         NOT NULL AUTO_INCREMENT,
    nombre  VARCHAR(50) NOT NULL COMMENT 'cliente, camarero, jefe_sala, admin',

    PRIMARY KEY (id_rol),
    UNIQUE KEY uq_roles_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (nombre) VALUES
    ('cliente'),
    ('camarero'),
    ('jefe_sala'),
    ('admin');

-- ============================================================
-- 2. USUARIOS
-- Personas registradas en el sistema
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario  INT           NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(100)  NOT NULL,
    apellidos   VARCHAR(150)  NOT NULL,
    telefono    VARCHAR(20)   NOT NULL,
    email       VARCHAR(150)  NOT NULL,
    password    VARCHAR(255)  NOT NULL COMMENT 'Hash bcrypt',
    id_rol      INT           NOT NULL DEFAULT 1 COMMENT 'Por defecto: cliente',
    activo      TINYINT(1)    NOT NULL DEFAULT 1 COMMENT '1=activo, 0=desactivado',
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_usuario),
    UNIQUE KEY uq_usuarios_email (email),
    CONSTRAINT fk_usuarios_rol FOREIGN KEY (id_rol) REFERENCES roles (id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. HORARIOS
-- Slots de 30 minutos disponibles para reservas
-- Turno mediodia: 13:00 - 17:00 | Turno noche: 20:00 - 00:00
-- ============================================================
CREATE TABLE IF NOT EXISTS horarios (
    id_horario  INT        NOT NULL AUTO_INCREMENT,
    hora_inicio TIME       NOT NULL COMMENT 'Inicio del slot, ej: 13:00',
    hora_fin    TIME       NOT NULL COMMENT 'Fin del slot, ej: 13:30',
    activo      TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=disponible, 0=bloqueado',

    PRIMARY KEY (id_horario),
    UNIQUE KEY uq_horarios_inicio (hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Turno mediodia: 13:00 - 17:00
INSERT INTO horarios (hora_inicio, hora_fin) VALUES
    ('13:00:00', '13:30:00'),
    ('13:30:00', '14:00:00'),
    ('14:00:00', '14:30:00'),
    ('14:30:00', '15:00:00'),
    ('15:00:00', '15:30:00'),
    ('15:30:00', '16:00:00'),
    ('16:00:00', '16:30:00'),
    ('16:30:00', '17:00:00');

-- Turno noche: 20:00 - 00:00
INSERT INTO horarios (hora_inicio, hora_fin) VALUES
    ('20:00:00', '20:30:00'),
    ('20:30:00', '21:00:00'),
    ('21:00:00', '21:30:00'),
    ('21:30:00', '22:00:00'),
    ('22:00:00', '22:30:00'),
    ('22:30:00', '23:00:00'),
    ('23:00:00', '23:30:00'),
    ('23:30:00', '00:00:00');

-- ============================================================
-- 4. CIERRES
-- Dias en los que el restaurante no abre
-- ============================================================
CREATE TABLE IF NOT EXISTS cierres (
    id_cierre  INT          NOT NULL AUTO_INCREMENT,
    fecha      DATE         NOT NULL COMMENT 'Dia en que el restaurante cierra',
    motivo     VARCHAR(255)          COMMENT 'Ej: festivo, vacaciones, evento privado',

    PRIMARY KEY (id_cierre),
    UNIQUE KEY uq_cierres_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. AFORO
-- Capacidad maxima del restaurante por slot de fecha + hora
-- Si no existe fila para un slot concreto, el backend asume 40 personas
-- ============================================================
CREATE TABLE IF NOT EXISTS aforo (
    id_aforo        INT  NOT NULL AUTO_INCREMENT,
    fecha           DATE NOT NULL COMMENT 'Dia del slot',
    hora            TIME NOT NULL COMMENT 'Hora exacta del slot, ej: 13:00',
    capacidad_total INT  NOT NULL DEFAULT 40 COMMENT 'Maximo de personas permitidas en ese slot',

    PRIMARY KEY (id_aforo),
    UNIQUE KEY uq_aforo_fecha_hora (fecha, hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. RESERVAS
-- Cada reserva ocupa 2 horas y genera 4 bloques de 30 min
-- capacidad_asignada = CEIL(num_personas / 2) * 2
-- ============================================================
CREATE TABLE IF NOT EXISTS reservas (
    id_reserva          INT           NOT NULL AUTO_INCREMENT,
    id_usuario          INT                    COMMENT 'NULL si reserva sin cuenta',
    nombre              VARCHAR(100)  NOT NULL COMMENT 'Nombre del cliente',
    apellidos           VARCHAR(150)  NOT NULL,
    telefono            VARCHAR(20)   NOT NULL,
    email               VARCHAR(150)  NOT NULL,
    fecha               DATE          NOT NULL COMMENT 'Dia de la reserva',
    hora_inicio         TIME          NOT NULL COMMENT 'Hora de llegada',
    hora_fin            TIME          NOT NULL COMMENT 'hora_inicio + 2 horas',
    num_personas        INT           NOT NULL,
    capacidad_asignada  INT           NOT NULL COMMENT 'CEIL(num_personas / 2) * 2',
    estado              ENUM('pendiente','confirmada','cancelada') NOT NULL DEFAULT 'pendiente',
    numero_mesa         INT                    COMMENT 'Asignada por el jefe de sala',
    id_camarero         INT                    COMMENT 'Camarero asignado a la reserva',
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_reserva),
    CONSTRAINT fk_reservas_usuario   FOREIGN KEY (id_usuario)  REFERENCES usuarios (id_usuario) ON DELETE SET NULL,
    CONSTRAINT fk_reservas_camarero  FOREIGN KEY (id_camarero) REFERENCES usuarios (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. BLOQUES_RESERVA
-- Cada reserva genera exactamente 4 bloques de 30 minutos
-- Se usan para calcular el aforo ocupado en cada slot
-- ============================================================
CREATE TABLE IF NOT EXISTS bloques_reserva (
    id_bloque           INT  NOT NULL AUTO_INCREMENT,
    id_reserva          INT  NOT NULL,
    fecha               DATE NOT NULL COMMENT 'Mismo dia que la reserva',
    hora_inicio         TIME NOT NULL COMMENT 'Inicio del bloque de 30 min',
    hora_fin            TIME NOT NULL COMMENT 'Fin del bloque de 30 min',
    capacidad_asignada  INT  NOT NULL COMMENT 'Igual que en la reserva padre',

    PRIMARY KEY (id_bloque),
    CONSTRAINT fk_bloques_reserva FOREIGN KEY (id_reserva) REFERENCES reservas (id_reserva)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. HORARIOS_TRABAJADORES
-- Jornada semanal de cada empleado (40 h/semana, 5 dias trabajo, 2 descanso)
-- ============================================================
CREATE TABLE IF NOT EXISTS horarios_trabajadores (
    id_horario_trabajador  INT     NOT NULL AUTO_INCREMENT,
    id_usuario             INT     NOT NULL COMMENT 'FK al trabajador (camarero o jefe_sala)',
    semana_inicio          DATE    NOT NULL COMMENT 'Lunes de la semana (YYYY-MM-DD)',
    dias_trabajo           TEXT    NOT NULL COMMENT 'JSON: ["Lunes","Martes",...] — siempre 5 dias',
    dias_descanso          TEXT    NOT NULL COMMENT 'JSON: ["Sabado","Domingo"]   — siempre 2 dias',
    horas_por_dia          TINYINT NOT NULL DEFAULT 8 COMMENT 'Fijo: 8 h/dia = 40 h/semana',

    PRIMARY KEY (id_horario_trabajador),
    UNIQUE KEY uq_trabajador_semana (id_usuario, semana_inicio),
    CONSTRAINT fk_htrab_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. HORARIOS_EMPLEADOS
-- Asignacion diaria de turno o descanso para cada empleado
-- ============================================================
CREATE TABLE IF NOT EXISTS horarios_empleados (
    id           INT      NOT NULL AUTO_INCREMENT,
    empleado_id  INT      NOT NULL COMMENT 'FK a usuarios (camarero o jefe_sala)',
    fecha        DATE     NOT NULL COMMENT 'Dia concreto de la asignacion',
    estado       ENUM('trabajo','libre') NOT NULL DEFAULT 'trabajo',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_empleado_fecha (empleado_id, fecha),
    CONSTRAINT fk_he_usuario FOREIGN KEY (empleado_id) REFERENCES usuarios (id_usuario)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. CATEGORIAS
-- Agrupaciones del menu: entrantes, carnes, postres, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria  INT          NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(100) NOT NULL,
    orden         INT          NOT NULL DEFAULT 0 COMMENT 'Orden de aparicion en la carta',
    descripcion   TEXT                  COMMENT 'Descripcion opcional de la categoria',

    PRIMARY KEY (id_categoria),
    UNIQUE KEY uq_categorias_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. PLATOS
-- Cada plato pertenece a una categoria del menu
-- ============================================================
CREATE TABLE IF NOT EXISTS platos (
    id_plato      INT           NOT NULL AUTO_INCREMENT,
    id_categoria  INT           NOT NULL,
    nombre        VARCHAR(150)  NOT NULL,
    descripcion   TEXT                   COMMENT 'Ingredientes o descripcion del plato',
    precio        DECIMAL(6, 2) NOT NULL COMMENT 'Precio en euros, ej: 12.50',
    imagen        VARCHAR(500)           COMMENT 'URL o ruta relativa de la imagen',
    activo        TINYINT(1)    NOT NULL DEFAULT 1 COMMENT '1=visible en carta, 0=oculto',
    destacado     TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '1=aparece en el carrusel de la landing',

    PRIMARY KEY (id_plato),
    CONSTRAINT fk_platos_categoria FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
