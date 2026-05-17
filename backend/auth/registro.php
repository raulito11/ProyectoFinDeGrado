<?php
header('Content-Type: application/json');
session_start();
require_once __DIR__ . '/../config/db.php';

// solo acepto POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// recojo los datos que manda el cliente
$datos = json_decode(file_get_contents('php://input'), true);

// compruebo que estén todos los campos obligatorios
if (
    empty($datos['nombre']) ||
    empty($datos['apellidos']) ||
    empty($datos['email']) ||
    empty($datos['telefono']) ||
    empty($datos['password'])
) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios']);
    exit;
}

$nombre    = trim($datos['nombre']);
$apellidos = trim($datos['apellidos']);
$email     = trim($datos['email']);
$telefono  = trim($datos['telefono']);
$password  = $datos['password'];

// valido el formato del email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El formato del email no es válido']);
    exit;
}

// compruebo que el email no esté ya registrado
$sql = "SELECT id_usuario FROM usuarios WHERE email = :email";
$stmt = $pdo->prepare($sql);
$stmt->execute([':email' => $email]);
$usuarioExistente = $stmt->fetch(PDO::FETCH_ASSOC);

if ($usuarioExistente) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Ya existe una cuenta con ese email']);
    exit;
}

// obtengo el id del rol "cliente"
$sql = "SELECT id_rol FROM roles WHERE nombre = 'cliente'";
$stmt = $pdo->prepare($sql);
$stmt->execute();
$rol = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$rol) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno: rol cliente no encontrado']);
    exit;
}

$id_rol = $rol['id_rol'];

// hasheo la contraseña antes de guardarla
$password_hash = password_hash($password, PASSWORD_DEFAULT);

// inserto el nuevo usuario en la base de datos
$sql = "INSERT INTO usuarios (nombre, apellidos, email, telefono, password, id_rol)
        VALUES (:nombre, :apellidos, :email, :telefono, :password, :id_rol)";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':nombre'    => $nombre,
    ':apellidos' => $apellidos,
    ':email'     => $email,
    ':telefono'  => $telefono,
    ':password'  => $password_hash,
    ':id_rol'    => $id_rol
]);

$id_usuario = $pdo->lastInsertId();

// inicio sesion automaticamente tras el registro
$_SESSION['id']     = $id_usuario;
$_SESSION['nombre'] = $nombre;
$_SESSION['email']  = $email;
$_SESSION['rol']    = 'cliente';

echo json_encode([
    'success' => true,
    'message' => 'Usuario registrado correctamente',
    'rol'     => 'cliente',
    'nombre'  => $nombre
]);
