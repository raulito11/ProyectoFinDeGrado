-- ============================================================
-- alter_carta_orden.sql
-- Añade columna 'orden' a la tabla categorias.
-- Permite controlar el orden de aparición en la carta.
-- Ejecutar en phpMyAdmin sobre la base de datos restaurante_tfg.
-- ============================================================

USE restaurante_tfg;

ALTER TABLE categorias
    ADD COLUMN orden INT NOT NULL DEFAULT 0
        COMMENT 'Orden de aparición de la categoría en la carta'
        AFTER nombre;
