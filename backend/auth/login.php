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
    echo json_encode(['success' => false, 'message' => 'Email y contraseña son obligatorios']);
    exit;
}

// incluyo la conexión a la base de datos ANTES de extraer variables
// (db.php define $password para MySQL y sobreescribiría la del usuario)
require_once __DIR__ . '/../config/db.php';

$email        = trim($datos['email']);
$pass_usuario = $datos['password'];

// Query simple sin JOIN — igual que el test que funciona
$stmt = $pdo->prepare("SELECT id_usuario, nombre, email, password, activo, id_rol FROM usuarios WHERE email = ? LIMIT 1");
$stmt->execute([$email]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);

// compruebo que el usuario exista
if (!$usuario) {
    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas', '_d' => 'no_user']);
    exit;
}

// compruebo que la cuenta esté activa
if ($usuario['activo'] != 1) {
    echo json_encode(['success' => false, 'message' => 'La cuenta está desactivada']);
    exit;
}

// verifico la contraseña
if (!password_verify($pass_usuario, $usuario['password'])) {
    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas']);
    exit;
}

// obtengo el nombre del rol con query separada
$stmtRol = $pdo->prepare("SELECT nombre FROM roles WHERE id_rol = ? LIMIT 1");
$stmtRol->execute([$usuario['id_rol']]);
$rol = $stmtRol->fetchColumn() ?: 'cliente';

// todo correcto: guardo los datos del usuario en la sesión
$_SESSION['id']     = $usuario['id_usuario'];
$_SESSION['nombre'] = $usuario['nombre'];
$_SESSION['email']  = $usuario['email'];
$_SESSION['rol']    = $rol;

echo json_encode([
    'success' => true,
    'message' => 'Login correcto',
    'rol'     => $rol,
    'nombre'  => $usuario['nombre']
]);
