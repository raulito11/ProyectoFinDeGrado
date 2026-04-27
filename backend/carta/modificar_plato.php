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

if (empty($datos['id_plato'])) {
    echo json_encode(['success' => false, 'message' => 'El campo id_plato es obligatorio']);
    exit;
}

$id_plato = (int)$datos['id_plato'];

// valido precio si llega
if (isset($datos['precio']) && (float)$datos['precio'] <= 0) {
    echo json_encode(['success' => false, 'message' => 'El precio debe ser mayor que 0']);
    exit;
}

// si llega id_categoria, compruebo que exista
if (isset($datos['id_categoria'])) {
    $sqlCat = "SELECT id_categoria FROM categorias WHERE id_categoria = :id_categoria";
    $stmtCat = $pdo->prepare($sqlCat);
    $stmtCat->execute([':id_categoria' => (int)$datos['id_categoria']]);

    if (!$stmtCat->fetch()) {
        echo json_encode(['success' => false, 'message' => 'La categoría indicada no existe']);
        exit;
    }
}

// construyo el UPDATE dinámico — solo actualizo los campos que llegaron
$campos = [];
$params = [':id_plato' => $id_plato];

if (isset($datos['nombre'])) {
    $campos[] = 'nombre = :nombre';
    $params[':nombre'] = trim($datos['nombre']);
}
if (isset($datos['descripcion'])) {
    $campos[] = 'descripcion = :descripcion';
    $params[':descripcion'] = trim($datos['descripcion']);
}
if (isset($datos['precio'])) {
    $campos[] = 'precio = :precio';
    $params[':precio'] = (float)$datos['precio'];
}
if (isset($datos['activo'])) {
    $campos[] = 'activo = :activo';
    $params[':activo'] = (int)$datos['activo'];
}
if (isset($datos['id_categoria'])) {
    $campos[] = 'id_categoria = :id_categoria';
    $params[':id_categoria'] = (int)$datos['id_categoria'];
}

// si no mandan ningún campo para actualizar no tiene sentido ejecutar la query
if (empty($campos)) {
    echo json_encode(['success' => false, 'message' => 'No se enviaron campos para actualizar']);
    exit;
}

$sql = "UPDATE platos SET " . implode(', ', $campos) . " WHERE id_plato = :id_plato";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

if ($stmt->rowCount() === 0) {
    echo json_encode(['success' => false, 'message' => 'No se encontró el plato o no hubo cambios']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Plato actualizado']);
