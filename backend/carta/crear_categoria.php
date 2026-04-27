<?php
header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
    exit;
}

if ($_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No tienes permiso para hacer esto']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$datos = json_decode(file_get_contents('php://input'), true);

// el nombre es obligatorio
if (empty($datos['nombre'])) {
    echo json_encode(['success' => false, 'message' => 'El nombre de la categoría es obligatorio']);
    exit;
}

$nombre = trim($datos['nombre']);
$descripcion = isset($datos['descripcion']) ? trim($datos['descripcion']) : null;

$sql = "INSERT INTO categorias (nombre, descripcion, activo) VALUES (:nombre, :descripcion, 1)";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':nombre'      => $nombre,
    ':descripcion' => $descripcion
]);

$id_nueva = $pdo->lastInsertId();

echo json_encode(['success' => true, 'id_categoria' => (int)$id_nueva]);
