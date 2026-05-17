<?php
header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// solo usuarios autenticados — el id siempre viene de la sesión, nunca del cliente
if (empty($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$datos      = json_decode(file_get_contents('php://input'), true);
$id_usuario = (int) $_SESSION['id'];

// campos editables por el propio usuario
$campos = [];
$params = [':id_usuario' => $id_usuario];

if (!empty($datos['nombre'])) {
    $campos[] = 'nombre = :nombre';
    $params[':nombre'] = trim($datos['nombre']);
}

if (isset($datos['apellidos']) && $datos['apellidos'] !== '') {
    $campos[] = 'apellidos = :apellidos';
    $params[':apellidos'] = trim($datos['apellidos']);
}

if (!empty($datos['telefono'])) {
    $campos[] = 'telefono = :telefono';
    $params[':telefono'] = trim($datos['telefono']);
}

// cambio de contraseña opcional: requiere la contraseña actual
if (!empty($datos['password_nueva'])) {
    if (empty($datos['password_actual'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Debes introducir tu contraseña actual para cambiarla']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT password FROM usuarios WHERE id_usuario = :id_usuario LIMIT 1");
        $stmt->execute([':id_usuario' => $id_usuario]);
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$fila || !password_verify($datos['password_actual'], $fila['password'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'La contraseña actual no es correcta']);
            exit;
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al verificar la contraseña']);
        exit;
    }

    $campos[] = 'password = :password';
    $params[':password'] = password_hash($datos['password_nueva'], PASSWORD_DEFAULT);
}

if (empty($campos)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No se enviaron campos para actualizar']);
    exit;
}

try {
    $sql  = "UPDATE usuarios SET " . implode(', ', $campos) . " WHERE id_usuario = :id_usuario";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // actualizo el nombre en sesión si cambió
    if (!empty($datos['nombre'])) {
        $_SESSION['nombre'] = trim($datos['nombre']);
    }

    echo json_encode(['success' => true, 'message' => 'Perfil actualizado correctamente']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al actualizar el perfil']);
}
