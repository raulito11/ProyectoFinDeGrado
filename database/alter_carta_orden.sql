-- ============================================================
-- ALTER TABLE categorias y platos
-- Añade columna 'orden' a ambas tablas
-- Permite controlar el orden de aparición en la carta
-- ============================================================

USE restaurante_tfg;

-- 'orden' en categorias: define el orden en que aparecen las categorías en la carta.
-- Cuanto menor el número, antes aparece. 0 = sin orden definido.
ALTER TABLE categorias
    ADD COLUMN orden INT NOT NULL DEFAULT 0
        COMMENT 'Orden de aparición de la categoría en la carta'
        AFTER nombre;

