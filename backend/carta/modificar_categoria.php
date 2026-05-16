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

if (empty($datos['id_categoria'])) {
    echo json_encode(['success' => false, 'message' => 'El campo id_categoria es obligatorio']);
    exit;
}

$id_categoria = (int)$datos['id_categoria'];

// construyo el UPDATE dinámico con los campos que llegaron
$campos = [];
$params = [':id_categoria' => $id_categoria];

if (isset($datos['nombre'])) {
    $campos[] = 'nombre = :nombre';
    $params[':nombre'] = trim($datos['nombre']);
}
if (isset($datos['descripcion'])) {
    $campos[] = 'descripcion = :descripcion';
    $params[':descripcion'] = trim($datos['descripcion']);
}
if (isset($datos['orden'])) {
    $campos[] = 'orden = :orden';
    $params[':orden'] = (int)$datos['orden'];
}

if (empty($campos)) {
    echo json_encode(['success' => false, 'message' => 'No se enviaron campos para actualizar']);
    exit;
}

$sql = "UPDATE categorias SET " . implode(', ', $campos) . " WHERE id_categoria = :id_categoria";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

if ($stmt->rowCount() === 0) {
    echo json_encode(['success' => false, 'message' => 'No se encontró la categoría o no hubo cambios']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Categoría actualizada']);
