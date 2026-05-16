-- ============================================================
-- TFG Restaurante - Datos iniciales de prueba
-- Autor: Raúl García Manotas — DAW 2º curso
--
-- IMPORTANTE: Ejecutar DESPUES de schema.sql
-- ============================================================
--
-- CONTRASENAS DE PRUEBA:
-- Todos los usuarios tienen la misma contrasena: password
--
--   cliente@restaurante.com    -> password
--   camarero@restaurante.com   -> password
--   jefedesala@restaurante.com -> password
--   admin@restaurante.com      -> password
--
-- ============================================================

USE restaurante_tfg;

-- ============================================================
-- USUARIOS
-- Un usuario de prueba por cada rol del sistema
-- ============================================================

INSERT INTO usuarios (nombre, apellidos, telefono, email, password, id_rol, activo) VALUES
    -- cliente (id_rol = 1)
    ('Ana', 'García López',
     '612345678',
     'cliente@restaurante.com',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     1, 1),

    -- camarero (id_rol = 2)
    ('Carlos', 'López Martín',
     '623456789',
     'camarero@restaurante.com',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     2, 1),

    -- jefe_sala (id_rol = 3)
    ('María', 'Ruiz Sánchez',
     '634567890',
     'jefedesala@restaurante.com',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     3, 1),

    -- admin (id_rol = 4)
    ('Pedro', 'Admin Torres',
     '645678901',
     'admin@restaurante.com',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     4, 1);

-- ============================================================
-- CIERRES
-- Dias en los que el restaurante permanece cerrado
-- ============================================================

INSERT INTO cierres (fecha, motivo) VALUES
    ('2026-08-15', 'Asuncion de la Virgen — festivo nacional'),
    ('2026-11-01', 'Todos los Santos — festivo nacional'),
    ('2026-12-25', 'Navidad'),
    ('2027-01-01', 'Ano Nuevo');

-- ============================================================
-- AFORO
-- Capacidad maxima por slot de fecha + hora (40 personas por slot)
--
-- NOTA: Si no existe fila en aforo para una fecha+hora concreta,
-- el backend asume automaticamente 40 personas de capacidad.
-- Estos registros solo son necesarios si se quiere personalizar
-- el aforo de un dia concreto.
-- ============================================================

INSERT INTO aforo (fecha, hora, capacidad_total) VALUES
    -- Dia 1 de prueba — turno mediodia
    ('2026-06-15', '13:00:00', 40),
    ('2026-06-15', '13:30:00', 40),
    ('2026-06-15', '14:00:00', 40),
    ('2026-06-15', '14:30:00', 40),
    ('2026-06-15', '15:00:00', 40),
    ('2026-06-15', '15:30:00', 40),
    ('2026-06-15', '16:00:00', 40),
    ('2026-06-15', '16:30:00', 40),
    -- Dia 1 de prueba — turno noche
    ('2026-06-15', '20:00:00', 40),
    ('2026-06-15', '20:30:00', 40),
    ('2026-06-15', '21:00:00', 40),
    ('2026-06-15', '21:30:00', 40),
    ('2026-06-15', '22:00:00', 40),
    ('2026-06-15', '22:30:00', 40),
    ('2026-06-15', '23:00:00', 40),
    ('2026-06-15', '23:30:00', 40),

    -- Dia 2 de prueba — turno mediodia
    ('2026-06-16', '13:00:00', 40),
    ('2026-06-16', '13:30:00', 40),
    ('2026-06-16', '14:00:00', 40),
    ('2026-06-16', '14:30:00', 40),
    ('2026-06-16', '15:00:00', 40),
    ('2026-06-16', '15:30:00', 40),
    ('2026-06-16', '16:00:00', 40),
    ('2026-06-16', '16:30:00', 40),
    -- Dia 2 de prueba — turno noche
    ('2026-06-16', '20:00:00', 40),
    ('2026-06-16', '20:30:00', 40),
    ('2026-06-16', '21:00:00', 40),
    ('2026-06-16', '21:30:00', 40),
    ('2026-06-16', '22:00:00', 40),
    ('2026-06-16', '22:30:00', 40),
    ('2026-06-16', '23:00:00', 40),
    ('2026-06-16', '23:30:00', 40),

    -- Dia 3 de prueba — turno mediodia
    ('2026-06-17', '13:00:00', 40),
    ('2026-06-17', '13:30:00', 40),
    ('2026-06-17', '14:00:00', 40),
    ('2026-06-17', '14:30:00', 40),
    ('2026-06-17', '15:00:00', 40),
    ('2026-06-17', '15:30:00', 40),
    ('2026-06-17', '16:00:00', 40),
    ('2026-06-17', '16:30:00', 40),
    -- Dia 3 de prueba — turno noche
    ('2026-06-17', '20:00:00', 40),
    ('2026-06-17', '20:30:00', 40),
    ('2026-06-17', '21:00:00', 40),
    ('2026-06-17', '21:30:00', 40),
    ('2026-06-17', '22:00:00', 40),
    ('2026-06-17', '22:30:00', 40),
    ('2026-06-17', '23:00:00', 40),
    ('2026-06-17', '23:30:00', 40);

-- ============================================================
-- CATEGORIAS DEL MENU
-- ============================================================

INSERT INTO categorias (nombre, orden, descripcion) VALUES
    ('Entrantes',  1, 'Aperitivos y entrantes para compartir'),
    ('Carnes',     2, 'Carnes a la brasa y a la plancha'),
    ('Postres',    3, 'Postres caseros del dia');

-- ============================================================
-- PLATOS DEL MENU
-- id_categoria: 1=Entrantes, 2=Carnes, 3=Postres
-- destacado=1: aparece en el carrusel de la landing page
-- ============================================================

INSERT INTO platos (id_categoria, nombre, descripcion, precio, imagen, activo, destacado) VALUES
    -- Entrantes
    (1, 'Croquetas de jamon',
        'Croquetas caseras de jamon iberico con bechamel cremosa',
        8.50, 'img/platos/croquetas.jpg', 1, 1),

    (1, 'Tabla de ibericos',
        'Seleccion de embutidos ibericos: lomo, chorizo y salchichon',
        14.00, 'img/platos/tabla_ibericos.jpg', 1, 0),

    -- Carnes
    (2, 'Chuleton de ternera',
        'Chuleton de ternera gallega a la brasa, 400g. Se sirve con patatas y pimientos',
        24.00, 'img/platos/chuleton.jpg', 1, 1),

    (2, 'Secreto iberico',
        'Secreto de cerdo iberico a la plancha con reduccion de Pedro Ximenez',
        18.50, 'img/platos/secreto.jpg', 1, 0),

    -- Postres
    (3, 'Tarta de queso',
        'Tarta de queso al horno estilo La Vina, con mermelada de arandanos',
        6.50, 'img/platos/tarta_queso.jpg', 1, 1),

    (3, 'Brownie con helado',
        'Brownie de chocolate caliente con bola de helado de vainilla',
        7.00, 'img/platos/brownie.jpg', 1, 0);

-- ============================================================
-- RESERVAS DE PRUEBA
-- Ejemplos para probar distintos estados y flujos
-- ============================================================

-- Reserva 1: confirmada de Ana Garcia para el 2026-06-15 a las 14:00
-- 3 personas -> capacidad_asignada = CEIL(3/2)*2 = 4
INSERT INTO reservas
    (id_usuario, nombre, apellidos, telefono, email,
     fecha, hora_inicio, hora_fin, num_personas, capacidad_asignada, estado)
VALUES
    (1, 'Ana', 'García', '612345678', 'cliente@restaurante.com',
     '2026-06-15', '14:00:00', '16:00:00', 3, 4, 'confirmada');

INSERT INTO bloques_reserva (id_reserva, fecha, hora_inicio, hora_fin, capacidad_asignada) VALUES
    (1, '2026-06-15', '14:00:00', '14:30:00', 4),
    (1, '2026-06-15', '14:30:00', '15:00:00', 4),
    (1, '2026-06-15', '15:00:00', '15:30:00', 4),
    (1, '2026-06-15', '15:30:00', '16:00:00', 4);

-- Reserva 2: pendiente sin usuario (reserva como invitado) para el 2026-06-16 a las 21:00
-- 5 personas -> capacidad_asignada = CEIL(5/2)*2 = 6
INSERT INTO reservas
    (id_usuario, nombre, apellidos, telefono, email,
     fecha, hora_inicio, hora_fin, num_personas, capacidad_asignada, estado)
VALUES
    (NULL, 'Luis', 'Martínez', '698765432', 'luis@example.com',
     '2026-06-16', '21:00:00', '23:00:00', 5, 6, 'pendiente');

INSERT INTO bloques_reserva (id_reserva, fecha, hora_inicio, hora_fin, capacidad_asignada) VALUES
    (2, '2026-06-16', '21:00:00', '21:30:00', 6),
    (2, '2026-06-16', '21:30:00', '22:00:00', 6),
    (2, '2026-06-16', '22:00:00', '22:30:00', 6),
    (2, '2026-06-16', '22:30:00', '23:00:00', 6);

-- Reserva 3: cancelada de Ana Garcia para ver el historial con distintos estados
-- 2 personas -> capacidad_asignada = CEIL(2/2)*2 = 2
INSERT INTO reservas
    (id_usuario, nombre, apellidos, telefono, email,
     fecha, hora_inicio, hora_fin, num_personas, capacidad_asignada, estado)
VALUES
    (1, 'Ana', 'García', '612345678', 'cliente@restaurante.com',
     '2026-06-17', '13:00:00', '15:00:00', 2, 2, 'cancelada');

INSERT INTO bloques_reserva (id_reserva, fecha, hora_inicio, hora_fin, capacidad_asignada) VALUES
    (3, '2026-06-17', '13:00:00', '13:30:00', 2),
    (3, '2026-06-17', '13:30:00', '14:00:00', 2),
    (3, '2026-06-17', '14:00:00', '14:30:00', 2),
    (3, '2026-06-17', '14:30:00', '15:00:00', 2);
