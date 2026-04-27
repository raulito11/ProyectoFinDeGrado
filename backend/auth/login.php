<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

// solo acepto POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// recojo los datos que me mandan desde el frontend
$datos = json_decode(file_get_contents('php://input'), true);

// compruebo que lleguen email y password
if (empty($datos['email']) || empty($datos['password'])) {
    echo json_encode(['success' => false, 'message' => 'Email y contraseña son obligatorios']);
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
    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas']);
    exit;
}

// compruebo que la cuenta esté activa
if ($usuario['activo'] != 1) {
    echo json_encode(['success' => false, 'message' => 'La cuenta está desactivada']);
    exit;
}

// verifico la contraseña con password_verify (las contraseñas están hasheadas)
if (!password_verify($password, $usuario['password'])) {
    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas']);
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
