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

$email    = trim($datos['email']);
$password = $datos['password'];

// incluyo la conexión a la base de datos
require_once __DIR__ . '/../config/db.php';

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
$hash_db = $usuario['password'];
$verify  = password_verify($password, $hash_db);
if (!$verify) {
    echo json_encode([
        'success'      => false,
        'message'      => 'Credenciales incorrectas',
        '_d'           => 'bad_pass',
        '_hash_b64'    => base64_encode($hash_db),
        '_pass_b64'    => base64_encode($password),
        '_pass_len'    => strlen($password),
        '_hash_len'    => strlen($hash_db),
        '_verify_literal' => password_verify('password', $hash_db),
    ]);
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
