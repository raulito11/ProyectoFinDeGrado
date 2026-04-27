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

// campos obligatorios
if (empty($datos['id_categoria']) || empty($datos['nombre']) || !isset($datos['precio'])) {
    echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios: id_categoria, nombre y precio']);
    exit;
}

$id_categoria = (int)$datos['id_categoria'];
$nombre       = trim($datos['nombre']);
$descripcion  = isset($datos['descripcion']) ? trim($datos['descripcion']) : null;
$precio       = (float)$datos['precio'];

// el precio tiene que ser positivo
if ($precio <= 0) {
    echo json_encode(['success' => false, 'message' => 'El precio debe ser mayor que 0']);
    exit;
}

// compruebo que la categoría exista en la base de datos
$sqlCat = "SELECT id_categoria FROM categorias WHERE id_categoria = :id_categoria";
$stmtCat = $pdo->prepare($sqlCat);
$stmtCat->execute([':id_categoria' => $id_categoria]);

if (!$stmtCat->fetch()) {
    echo json_encode(['success' => false, 'message' => 'La categoría indicada no existe']);
    exit;
}

$sql = "INSERT INTO platos (id_categoria, nombre, descripcion, precio, activo)
        VALUES (:id_categoria, :nombre, :descripcion, :precio, 1)";

$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':id_categoria' => $id_categoria,
    ':nombre'       => $nombre,
    ':descripcion'  => $descripcion,
    ':precio'       => $precio
]);

$id_nuevo = $pdo->lastInsertId();

echo json_encode(['success' => true, 'id_plato' => (int)$id_nuevo]);
