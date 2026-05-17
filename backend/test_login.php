<?php
// Archivo de diagnóstico temporal — ELIMINAR tras resolver el problema
header('Content-Type: application/json');

require_once __DIR__ . '/config/db.php';

$email = 'admin@restaurante.com';
$password_prueba = 'password';

// 1. Buscar el usuario
$sql = "SELECT u.id_usuario, u.nombre, u.email, u.password, u.activo, r.nombre AS rol
        FROM usuarios u
        JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.email = :email
        LIMIT 1";

$stmt = $pdo->prepare($sql);
$stmt->execute([':email' => $email]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$usuario) {
    echo json_encode([
        'paso' => 'usuario_no_encontrado',
        'email_buscado' => $email
    ]);
    exit;
}

// 2. Verificar contraseña
$hash_guardado = $usuario['password'];
$verify = password_verify($password_prueba, $hash_guardado);

echo json_encode([
    'usuario_encontrado' => true,
    'email' => $usuario['email'],
    'rol' => $usuario['rol'],
    'activo' => $usuario['activo'],
    'longitud_hash' => strlen($hash_guardado),
    'primeros_chars_hash' => substr($hash_guardado, 0, 10),
    'password_verify_resultado' => $verify,
    'php_version' => PHP_VERSION
]);
