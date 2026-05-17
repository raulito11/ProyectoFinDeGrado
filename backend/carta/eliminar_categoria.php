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

// Comprobar que existe
$stmtCheck = $pdo->prepare("SELECT id_categoria FROM categorias WHERE id_categoria = :id");
$stmtCheck->execute([':id' => $id_categoria]);

if (!$stmtCheck->fetch()) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'No se encontró la categoría']);
    exit;
}

// Comprobar que no tiene platos asociados
$stmtPlatos = $pdo->prepare("SELECT COUNT(*) FROM platos WHERE id_categoria = :id");
$stmtPlatos->execute([':id' => $id_categoria]);
$numPlatos = (int)$stmtPlatos->fetchColumn();

if ($numPlatos > 0) {
    echo json_encode(['success' => false, 'message' => 'No se puede eliminar: la categoría tiene ' . $numPlatos . ' plato(s) asociado(s)']);
    exit;
}

$stmt = $pdo->prepare("DELETE FROM categorias WHERE id_categoria = :id");
$stmt->execute([':id' => $id_categoria]);

echo json_encode(['success' => true, 'message' => 'Categoría eliminada']);
