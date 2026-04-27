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

// compruebo que el plato exista antes de borrar
$sqlCheck = "SELECT id_plato FROM platos WHERE id_plato = :id_plato";
$stmtCheck = $pdo->prepare($sqlCheck);
$stmtCheck->execute([':id_plato' => $id_plato]);

if (!$stmtCheck->fetch()) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'No se encontró el plato']);
    exit;
}

$sql = "DELETE FROM platos WHERE id_plato = :id_plato";
$stmt = $pdo->prepare($sql);
$stmt->execute([':id_plato' => $id_plato]);

echo json_encode(['success' => true, 'message' => 'Plato eliminado']);
