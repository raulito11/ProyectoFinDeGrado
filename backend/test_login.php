<?php
// Archivo de diagnóstico temporal — ELIMINAR tras resolver el problema
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

$raw_input = file_get_contents('php://input');
$datos     = json_decode($raw_input, true);

require_once __DIR__ . '/config/db.php';

$email    = isset($datos['email'])    ? trim($datos['email'])    : 'admin@restaurante.com';
$password = isset($datos['password']) ? $datos['password']       : 'password';

$sql = "SELECT u.id_usuario, u.nombre, u.email, u.password, u.activo, r.nombre AS rol
        FROM usuarios u
        JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.email = :email
        LIMIT 1";

$stmt = $pdo->prepare($sql);
$stmt->execute([':email' => $email]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode([
    'raw_input_recibido'     => $raw_input,
    'email_usado'            => $email,
    'password_usado'         => $password,
    'usuario_encontrado'     => $usuario ? true : false,
    'password_verify'        => $usuario ? password_verify($password, $usuario['password']) : null,
    'longitud_hash'          => $usuario ? strlen($usuario['password']) : null,
]);
