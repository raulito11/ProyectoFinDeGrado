-- ============================================================
-- TFG Restaurante - Esquema de base de datos
-- Autor: DAW 2º curso
-- Descripcion: Sistema de reservas para restaurante
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
    id_rol      INT          NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(50)  NOT NULL COMMENT 'cliente, camarero, jefe_sala, admin',

    PRIMARY KEY (id_rol),
    UNIQUE KEY uq_roles_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos iniciales de roles
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
-- Turnos: 13:00-17:00 (mediodia) y 20:00-00:00 (noche)
-- ============================================================
CREATE TABLE IF NOT EXISTS horarios (
    id_horario  INT         NOT NULL AUTO_INCREMENT,
    hora_inicio TIME        NOT NULL COMMENT 'Inicio del slot, ej: 13:00',
    hora_fin    TIME        NOT NULL COMMENT 'Fin del slot, ej: 13:30',
    activo      TINYINT(1)  NOT NULL DEFAULT 1 COMMENT '1=disponible, 0=bloqueado',

    PRIMARY KEY (id_horario),
    UNIQUE KEY uq_horarios_inicio (hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Slots del turno de mediodia: 13:00 - 17:00
-- Solo se pueden hacer reservas hasta las 15:00 (ultima reserva termina a las 17:00)
INSERT INTO horarios (hora_inicio, hora_fin) VALUES
    ('13:00:00', '13:30:00'),
    ('13:30:00', '14:00:00'),
    ('14:00:00', '14:30:00'),
    ('14:30:00', '15:00:00'),
    ('15:00:00', '15:30:00'),
    ('15:30:00', '16:00:00'),
    ('16:00:00', '16:30:00'),
    ('16:30:00', '17:00:00');

-- Slots del turno de noche: 20:00 - 00:00
-- Solo se pueden hacer reservas hasta las 22:00 (ultima reserva termina a las 00:00)
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
    id_cierre   INT          NOT NULL AUTO_INCREMENT,
    fecha       DATE         NOT NULL COMMENT 'Dia en que el restaurante cierra',
    motivo      VARCHAR(255)           COMMENT 'Ej: festivo, vacaciones, evento privado',

    PRIMARY KEY (id_cierre),
    UNIQUE KEY uq_cierres_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. AFORO
-- Capacidad maxima del restaurante por slot de fecha + hora
-- El aforo base es 40 personas por slot
-- ============================================================
CREATE TABLE IF NOT EXISTS aforo (
    id_aforo        INT  NOT NULL AUTO_INCREMENT,
    fecha           DATE NOT NULL COMMENT 'Dia del slot de aforo',
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
    hora_inicio         TIME          NOT NULL COMMENT 'Hora de llegada, ej: 14:00',
    hora_fin            TIME          NOT NULL COMMENT 'Hora de salida = hora_inicio + 2 horas',
    num_personas        INT           NOT NULL COMMENT 'Personas que vienen',
    capacidad_asignada  INT           NOT NULL COMMENT 'CEIL(num_personas / 2) * 2',
    estado              ENUM('pendiente','confirmada','cancelada')
                                      NOT NULL DEFAULT 'pendiente',
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_reserva),
    CONSTRAINT fk_reservas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON DELETE SET NULL
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
-- 8. CATEGORIAS
-- Agrupaciones del menu: entrantes, carnes, postres, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria  INT           NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(100)  NOT NULL,
    descripcion   TEXT                   COMMENT 'Descripcion opcional de la categoria',
    activo        TINYINT(1)    NOT NULL DEFAULT 1 COMMENT '1=visible, 0=oculta',

    PRIMARY KEY (id_categoria),
    UNIQUE KEY uq_categorias_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. PLATOS
-- Cada plato pertenece a una categoria del menu
-- ============================================================
CREATE TABLE IF NOT EXISTS platos (
    id_plato      INT             NOT NULL AUTO_INCREMENT,
    id_categoria  INT             NOT NULL,
    nombre        VARCHAR(150)    NOT NULL,
    descripcion   TEXT                     COMMENT 'Ingredientes o descripcion del plato',
    precio        DECIMAL(6, 2)   NOT NULL COMMENT 'Precio en euros, ej: 12.50',
    imagen        VARCHAR(255)             COMMENT 'Ruta relativa a la imagen, ej: img/platos/croquetas.jpg',
    activo        TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1=disponible, 0=no disponible',

    PRIMARY KEY (id_plato),
    CONSTRAINT fk_platos_categoria FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
