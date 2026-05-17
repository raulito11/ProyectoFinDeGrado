<?php
// Diagnóstico + fix de contraseñas — ELIMINAR tras resolver
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/config/db.php';

// 1. Generar hash correcto con PHP nativo
$hash_php = password_hash('password', PASSWORD_BCRYPT);

// 2. Actualizar TODOS los usuarios de prueba con este hash generado por PHP
$emails = ['cliente@restaurante.com', 'camarero@restaurante.com', 'jefedesala@restaurante.com', 'admin@restaurante.com'];
$placeholders = implode(',', array_fill(0, count($emails), '?'));
$stmt = $pdo->prepare("UPDATE usuarios SET password = ? WHERE email IN ($placeholders)");
$stmt->execute(array_merge([$hash_php], $emails));
$filas = $stmt->rowCount();

// 3. Verificar que funciona
$verify = password_verify('password', $hash_php);

echo json_encode([
    'hash_generado_php' => $hash_php,
    'longitud'          => strlen($hash_php),
    'filas_actualizadas' => $filas,
    'verify_ok'         => $verify
]);
