<?php
// Diagnóstico completo: escribe hash PHP nativo, lo relee de BD y verifica
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/config/db.php';

// 1. Generar hash PHP nativo
$hash_php = password_hash('password', PASSWORD_BCRYPT);

// 2. Actualizar TODOS los usuarios de prueba
$emails = ['cliente@restaurante.com', 'camarero@restaurante.com', 'jefedesala@restaurante.com', 'admin@restaurante.com'];
$placeholders = implode(',', array_fill(0, count($emails), '?'));
$stmt = $pdo->prepare("UPDATE usuarios SET password = ? WHERE email IN ($placeholders)");
$stmt->execute(array_merge([$hash_php], $emails));
$filas = $stmt->rowCount();

// 3. Releer el hash de la BD para un usuario concreto
$stmt2 = $pdo->prepare("SELECT password FROM usuarios WHERE email = ? LIMIT 1");
$stmt2->execute(['cliente@restaurante.com']);
$row = $stmt2->fetch(PDO::FETCH_ASSOC);
$hash_leido = $row ? $row['password'] : null;

// 4. Verificar el hash leido contra 'password'
$verify_db = $hash_leido ? password_verify('password', $hash_leido) : false;

// 5. Comparar si el hash escrito y el leido son identicos
$hashes_iguales = ($hash_php === $hash_leido);

echo json_encode([
    'hash_escrito'       => $hash_php,
    'longitud_escrito'   => strlen($hash_php),
    'hash_leido_bd'      => $hash_leido,
    'longitud_leido'     => $hash_leido ? strlen($hash_leido) : 0,
    'hashes_iguales'     => $hashes_iguales,
    'filas_actualizadas' => $filas,
    'verify_en_memoria'  => password_verify('password', $hash_php),
    'verify_desde_bd'    => $verify_db,
]);
