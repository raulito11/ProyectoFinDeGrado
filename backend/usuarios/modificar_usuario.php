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

// solo el admin puede modificar usuarios
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

$datos = json_decode(file_get_contents('php://input'), true);

// id_usuario es obligatorio para saber qué usuario modificar
if (empty($datos['id_usuario'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Falta el id_usuario']);
    exit;
}

$id_usuario = (int) $datos['id_usuario'];

try {
    // compruebo que el usuario exista
    $stmt = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE id_usuario = :id_usuario LIMIT 1");
    $stmt->execute([':id_usuario' => $id_usuario]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'El usuario no existe']);
        exit;
    }

    // si viene un email nuevo, compruebo que no lo tenga otro usuario
    if (!empty($datos['email'])) {
        $email_nuevo = trim($datos['email']);

        if (!filter_var($email_nuevo, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El email no tiene un formato válido']);
            exit;
        }

        $stmt = $pdo->prepare("
            SELECT id_usuario FROM usuarios
            WHERE email = :email AND id_usuario != :id_usuario
            LIMIT 1
        ");
        $stmt->execute([':email' => $email_nuevo, ':id_usuario' => $id_usuario]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ese email ya está en uso por otro usuario']);
            exit;
        }
    }

    // construyo el UPDATE de forma dinámica: solo actualizo lo que llegue
    $campos = [];
    $params = [':id_usuario' => $id_usuario];

    if (!empty($datos['nombre'])) {
        $campos[] = 'nombre = :nombre';
        $params[':nombre'] = trim($datos['nombre']);
    }

    if (!empty($datos['apellidos'])) {
        $campos[] = 'apellidos = :apellidos';
        $params[':apellidos'] = trim($datos['apellidos']);
    }

    if (!empty($datos['email'])) {
        $campos[] = 'email = :email';
        $params[':email'] = trim($datos['email']);
    }

    if (!empty($datos['telefono'])) {
        $campos[] = 'telefono = :telefono';
        $params[':telefono'] = trim($datos['telefono']);
    }

    if (!empty($datos['id_rol'])) {
        // compruebo que el nuevo rol existe
        $stmt = $pdo->prepare("SELECT id_rol FROM roles WHERE id_rol = :id_rol LIMIT 1");
        $stmt->execute([':id_rol' => (int) $datos['id_rol']]);
        if (!$stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El rol indicado no existe']);
            exit;
        }
        $campos[] = 'id_rol = :id_rol';
        $params[':id_rol'] = (int) $datos['id_rol'];
    }

    // si llega password, la rehasheo
    if (!empty($datos['password'])) {
        $campos[] = 'password = :password';
        $params[':password'] = password_hash($datos['password'], PASSWORD_DEFAULT);
    }

    // si no hay nada que actualizar, aviso
    if (empty($campos)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No se enviaron campos para actualizar']);
        exit;
    }

    $sql = "UPDATE usuarios SET " . implode(', ', $campos) . " WHERE id_usuario = :id_usuario";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true, 'message' => 'Usuario actualizado correctamente']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al modificar el usuario']);
}
