<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

session_start();
require_once __DIR__ . '/../config/db.php';

// solo acepto POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// solo el admin puede crear usuarios
if (empty($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit;
}

if ($_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No tienes permisos para esta acción']);
    exit;
}

// recojo los datos del cuerpo de la petición
$datos = json_decode(file_get_contents('php://input'), true);

// todos los campos son obligatorios
if (
    empty($datos['nombre'])   ||
    empty($datos['apellidos']) ||
    empty($datos['email'])    ||
    empty($datos['password']) ||
    empty($datos['telefono']) ||
    empty($datos['id_rol'])
) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
    exit;
}

$nombre    = trim($datos['nombre']);
$apellidos = trim($datos['apellidos']);
$email     = trim($datos['email']);
$password  = $datos['password'];
$telefono  = trim($datos['telefono']);
$id_rol    = (int) $datos['id_rol'];

// compruebo que el email tenga formato válido
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El email no tiene un formato válido']);
    exit;
}

try {
    // compruebo que el email no esté ya registrado
    $stmt = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ya existe un usuario con ese email']);
        exit;
    }

    // compruebo que el id_rol existe en la tabla roles
    $stmt = $pdo->prepare("SELECT id_rol FROM roles WHERE id_rol = :id_rol LIMIT 1");
    $stmt->execute([':id_rol' => $id_rol]);
    if (!$stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'El rol indicado no existe']);
        exit;
    }

    // hasheo la contraseña antes de guardarla
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // inserto el nuevo usuario
    $stmt = $pdo->prepare("
        INSERT INTO usuarios (nombre, apellidos, email, password, telefono, id_rol)
        VALUES (:nombre, :apellidos, :email, :password, :telefono, :id_rol)
    ");
    $stmt->execute([
        ':nombre'    => $nombre,
        ':apellidos' => $apellidos,
        ':email'     => $email,
        ':password'  => $password_hash,
        ':telefono'  => $telefono,
        ':id_rol'    => $id_rol,
    ]);

    $id_usuario = (int) $pdo->lastInsertId();

    echo json_encode([
        'success'    => true,
        'id_usuario' => $id_usuario,
        'message'    => 'Usuario creado correctamente'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al crear el usuario']);
}
