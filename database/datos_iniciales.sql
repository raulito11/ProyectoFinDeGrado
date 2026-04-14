-- ============================================================
-- TFG Restaurante - Datos iniciales de prueba
-- Autor: DAW 2º curso
-- Descripcion: Pobla la base de datos para desarrollo y pruebas
--
-- IMPORTANTE: Ejecutar DESPUES de schema.sql
-- No reinsertar: roles, horarios (ya estan en schema.sql)
-- ============================================================

-- NOTA SOBRE CONTRASENAS:
-- El hash de abajo es bcrypt valido para la contrasena: password
-- TODOS los usuarios de prueba tienen la misma contrasena: password
--
--   cliente@restaurante.com    -> password
--   camarero@restaurante.com   -> password
--   jefedesala@restaurante.com -> password
--   admin@restaurante.com      -> password
--
-- Para generar hashes con contrasenas propias, ejecuta desde PHP:
--   echo password_hash('nueva_contrasena', PASSWORD_DEFAULT);
-- ============================================================

USE restaurante_tfg;

-- ============================================================
-- USUARIOS
-- Un usuario de prueba por cada rol del sistema
-- ============================================================

INSERT INTO usuarios (nombre, email, password, id_rol, activo) VALUES
    -- cliente (id_rol = 1)
    ('Ana García',
     'cliente@restaurante.com',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     1, 1),

    -- camarero (id_rol = 2)
    ('Carlos López',
     'camarero@restaurante.com',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     2, 1),

    -- jefe_sala (id_rol = 3)
    ('María Ruiz',
     'jefedesala@restaurante.com',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     3, 1),

    -- admin (id_rol = 4)
    ('Pedro Admin',
     'admin@restaurante.com',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     4, 1);

-- ============================================================
-- CIERRES
-- Dias en los que el restaurante permanece cerrado
-- ============================================================

INSERT INTO cierres (fecha, motivo) VALUES
    ('2026-04-30', 'Festivo local Madrid'),
    ('2026-05-01', 'Dia del Trabajo'),
    ('2026-12-25', 'Navidad'),
    ('2026-01-01', 'Ano Nuevo');

-- ============================================================
-- AFORO
-- Capacidad maxima por slot de fecha + hora
--
-- NOTA: La tabla aforo requiere fecha + hora concretos.
-- Estos registros cubren los slots del turno de mediodia
-- y del turno de noche para los proximos dias de prueba.
-- En produccion, el backend generara estos registros
-- automaticamente al configurar el aforo de cada dia.
--
-- Capacidad base: 40 personas por slot
-- ============================================================

-- Aforo para fechas de prueba cercanas (mayo 2026)
INSERT INTO aforo (fecha, hora, capacidad_total) VALUES
    -- Turno mediodia
    ('2026-05-05', '13:00:00', 40),
    ('2026-05-05', '13:30:00', 40),
    ('2026-05-05', '14:00:00', 40),
    ('2026-05-05', '14:30:00', 40),
    ('2026-05-05', '15:00:00', 40),
    ('2026-05-05', '15:30:00', 40),
    ('2026-05-05', '16:00:00', 40),
    ('2026-05-05', '16:30:00', 40),
    -- Turno noche
    ('2026-05-05', '20:00:00', 40),
    ('2026-05-05', '20:30:00', 40),
    ('2026-05-05', '21:00:00', 40),
    ('2026-05-05', '21:30:00', 40),
    ('2026-05-05', '22:00:00', 40),
    ('2026-05-05', '22:30:00', 40),
    ('2026-05-05', '23:00:00', 40),
    ('2026-05-05', '23:30:00', 40),

    -- Segundo dia de prueba
    ('2026-05-06', '13:00:00', 40),
    ('2026-05-06', '13:30:00', 40),
    ('2026-05-06', '14:00:00', 40),
    ('2026-05-06', '14:30:00', 40),
    ('2026-05-06', '15:00:00', 40),
    ('2026-05-06', '15:30:00', 40),
    ('2026-05-06', '16:00:00', 40),
    ('2026-05-06', '16:30:00', 40),
    ('2026-05-06', '20:00:00', 40),
    ('2026-05-06', '20:30:00', 40),
    ('2026-05-06', '21:00:00', 40),
    ('2026-05-06', '21:30:00', 40),
    ('2026-05-06', '22:00:00', 40),
    ('2026-05-06', '22:30:00', 40),
    ('2026-05-06', '23:00:00', 40),
    ('2026-05-06', '23:30:00', 40),

    -- Tercer dia de prueba
    ('2026-05-07', '13:00:00', 40),
    ('2026-05-07', '13:30:00', 40),
    ('2026-05-07', '14:00:00', 40),
    ('2026-05-07', '14:30:00', 40),
    ('2026-05-07', '15:00:00', 40),
    ('2026-05-07', '15:30:00', 40),
    ('2026-05-07', '16:00:00', 40),
    ('2026-05-07', '16:30:00', 40),
    ('2026-05-07', '20:00:00', 40),
    ('2026-05-07', '20:30:00', 40),
    ('2026-05-07', '21:00:00', 40),
    ('2026-05-07', '21:30:00', 40),
    ('2026-05-07', '22:00:00', 40),
    ('2026-05-07', '22:30:00', 40),
    ('2026-05-07', '23:00:00', 40),
    ('2026-05-07', '23:30:00', 40);

-- ============================================================
-- CATEGORIAS DEL MENU
-- ============================================================

INSERT INTO categorias (nombre, descripcion, activo) VALUES
    ('Entrantes',  'Aperitivos y entrantes para compartir', 1),
    ('Carnes',     'Carnes a la brasa y a la plancha',      1),
    ('Postres',    'Postres caseros del dia',               1);

-- ============================================================
-- PLATOS DEL MENU
-- id_categoria: 1=Entrantes, 2=Carnes, 3=Postres
-- ============================================================

INSERT INTO platos (id_categoria, nombre, descripcion, precio, imagen, activo) VALUES
    -- Entrantes
    (1, 'Croquetas de jamon',
        'Croquetas caseras de jamon iberico con bechamel cremosa',
        8.50, 'img/platos/croquetas.jpg', 1),

    (1, 'Tabla de ibericos',
        'Seleccion de embutidos ibericos: lomo, chorizo y salchichon',
        14.00, 'img/platos/tabla_ibericos.jpg', 1),

    -- Carnes
    (2, 'Chuleton de ternera',
        'Chuleton de ternera gallega a la brasa, 400g. Se sirve con patatas y pimientos',
        24.00, 'img/platos/chuleton.jpg', 1),

    (2, 'Secreto iberico',
        'Secreto de cerdo iberico a la plancha con reduccion de Pedro Ximenez',
        18.50, 'img/platos/secreto.jpg', 1),

    -- Postres
    (3, 'Tarta de queso',
        'Tarta de queso al horno estilo La Vina, con mermelada de arandanos',
        6.50, 'img/platos/tarta_queso.jpg', 1),

    (3, 'Brownie con helado',
        'Brownie de chocolate caliente con bola de helado de vainilla',
        7.00, 'img/platos/brownie.jpg', 1);

-- ============================================================
-- RESERVAS DE PRUEBA
-- Ejemplos para probar distintos estados y flujos
-- ============================================================

-- Reserva 1: confirmada de Ana Garcia (usuario 1) para el 2026-05-05 a las 14:00
-- 3 personas -> capacidad_asignada = CEIL(3/2)*2 = 4
INSERT INTO reservas
    (id_usuario, nombre, apellidos, telefono, email,
     fecha, hora_inicio, hora_fin, num_personas, capacidad_asignada, estado)
VALUES
    (1, 'Ana', 'García', '612345678', 'cliente@restaurante.com',
     '2026-05-05', '14:00:00', '16:00:00', 3, 4, 'confirmada');

-- Bloques de la reserva 1 (id_reserva = 1)
-- Cubre los 4 slots de 30 min: 14:00 - 16:00
INSERT INTO bloques_reserva (id_reserva, fecha, hora_inicio, hora_fin, capacidad_asignada) VALUES
    (1, '2026-05-05', '14:00:00', '14:30:00', 4),
    (1, '2026-05-05', '14:30:00', '15:00:00', 4),
    (1, '2026-05-05', '15:00:00', '15:30:00', 4),
    (1, '2026-05-05', '15:30:00', '16:00:00', 4);

-- Reserva 2: pendiente sin usuario (reserva como invitado) para el 2026-05-06 a las 21:00
-- 5 personas -> capacidad_asignada = CEIL(5/2)*2 = 6
INSERT INTO reservas
    (id_usuario, nombre, apellidos, telefono, email,
     fecha, hora_inicio, hora_fin, num_personas, capacidad_asignada, estado)
VALUES
    (NULL, 'Luis', 'Martínez', '698765432', 'luis@example.com',
     '2026-05-06', '21:00:00', '23:00:00', 5, 6, 'pendiente');

-- Bloques de la reserva 2 (id_reserva = 2)
INSERT INTO bloques_reserva (id_reserva, fecha, hora_inicio, hora_fin, capacidad_asignada) VALUES
    (2, '2026-05-06', '21:00:00', '21:30:00', 6),
    (2, '2026-05-06', '21:30:00', '22:00:00', 6),
    (2, '2026-05-06', '22:00:00', '22:30:00', 6),
    (2, '2026-05-06', '22:30:00', '23:00:00', 6);

-- Reserva 3: cancelada de Ana Garcia para ver el historial con distintos estados
-- 2 personas -> capacidad_asignada = CEIL(2/2)*2 = 2
INSERT INTO reservas
    (id_usuario, nombre, apellidos, telefono, email,
     fecha, hora_inicio, hora_fin, num_personas, capacidad_asignada, estado)
VALUES
    (1, 'Ana', 'García', '612345678', 'cliente@restaurante.com',
     '2026-05-07', '13:00:00', '15:00:00', 2, 2, 'cancelada');

-- Los bloques de una reserva cancelada se insertan igualmente
-- (el estado 'cancelada' en reservas ya indica que no ocupa aforo real;
--  el backend debe ignorar estos bloques al calcular disponibilidad)
INSERT INTO bloques_reserva (id_reserva, fecha, hora_inicio, hora_fin, capacidad_asignada) VALUES
    (3, '2026-05-07', '13:00:00', '13:30:00', 2),
    (3, '2026-05-07', '13:30:00', '14:00:00', 2),
    (3, '2026-05-07', '14:00:00', '14:30:00', 2),
    (3, '2026-05-07', '14:30:00', '15:00:00', 2);
