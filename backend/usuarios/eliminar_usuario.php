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

// solo el admin puede eliminar usuarios
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

if (empty($datos['id_usuario'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Falta el id_usuario']);
    exit;
}

$id_usuario = (int) $datos['id_usuario'];

// no se puede eliminar a uno mismo
if ($_SESSION['id'] == $id_usuario) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No puedes eliminar tu propio usuario']);
    exit;
}

try {
    // compruebo que el usuario exista antes de intentar borrarlo
    $stmt = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE id_usuario = :id_usuario LIMIT 1");
    $stmt->execute([':id_usuario' => $id_usuario]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'El usuario no existe']);
        exit;
    }

    // elimino el usuario
    $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id_usuario = :id_usuario");
    $stmt->execute([':id_usuario' => $id_usuario]);

    echo json_encode(['success' => true, 'message' => 'Usuario eliminado correctamente']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al eliminar el usuario']);
}
