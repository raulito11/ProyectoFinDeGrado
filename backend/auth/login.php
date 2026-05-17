<?php
header('Content-Type: application/json');
session_start();

// solo acepto POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// recojo los datos que me mandan desde el frontend
$raw   = file_get_contents('php://input');
$datos = json_decode($raw, true);

// compruebo que lleguen email y password
if (empty($datos['email']) || empty($datos['password'])) {
    echo json_encode(['success' => false, 'message' => 'Email y contraseña son obligatorios', '_debug_raw' => $raw]);
    exit;
}

$email    = trim($datos['email']);
$password = $datos['password'];

// incluyo la conexión a la base de datos
require_once __DIR__ . '/../config/db.php';

// busco el usuario por email, junto con su rol
$sql = "SELECT u.id_usuario, u.nombre, u.email, u.password, u.activo, r.nombre AS rol
        FROM usuarios u
        JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.email = :email
        LIMIT 1";

$stmt = $pdo->prepare($sql);
$stmt->execute([':email' => $email]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);

// compruebo que el usuario exista
if (!$usuario) {
    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas', '_debug' => 'usuario_no_encontrado', '_email_buscado' => $email, '_raw' => $raw]);
    exit;
}

// compruebo que la cuenta esté activa
if ($usuario['activo'] != 1) {
    echo json_encode(['success' => false, 'message' => 'La cuenta está desactivada']);
    exit;
}

// verifico la contraseña con password_verify (las contraseñas están hasheadas)
if (!password_verify($password, $usuario['password'])) {
    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas', '_debug' => 'password_verify_false', '_hash_len' => strlen($usuario['password']), '_hash_start' => substr($usuario['password'], 0, 7)]);
    exit;
}

// todo correcto: guardo los datos del usuario en la sesión
$_SESSION['id']     = $usuario['id_usuario'];
$_SESSION['nombre'] = $usuario['nombre'];
$_SESSION['email']  = $usuario['email'];
$_SESSION['rol']    = $usuario['rol'];

echo json_encode([
    'success' => true,
    'message' => 'Login correcto',
    'rol'     => $usuario['rol'],
    'nombre'  => $usuario['nombre']
]);
