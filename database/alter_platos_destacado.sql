-- ============================================================
-- ALTER TABLE platos
-- Añade columna 'destacado' y amplia 'imagen' a VARCHAR(500)
-- Usado para el carrusel de la landing page
-- ============================================================

USE restaurante_tfg;

-- 'destacado': indica si el plato aparece en el carrusel de la landing page.
-- 0 = no aparece, 1 = aparece en el carrusel.
ALTER TABLE platos
    ADD COLUMN destacado TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '1=aparece en el carrusel de la landing, 0=no aparece'
        AFTER activo;

-- 'imagen': ampliar de VARCHAR(255) a VARCHAR(500) para admitir URLs largas
-- (por ejemplo URLs de imágenes externas o rutas con parámetros).
ALTER TABLE platos
    MODIFY COLUMN imagen VARCHAR(500) NULL
        COMMENT 'URL o ruta de la imagen del plato para el carrusel';
