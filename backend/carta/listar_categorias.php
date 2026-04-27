<?php
header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/../config/db.php';

// solo admins pueden ver la gestión de carta
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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// traigo todas las categorías, activas e inactivas
$sql = "SELECT id_categoria, nombre, descripcion, activo
        FROM categorias
        ORDER BY id_categoria ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute();
$categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'data' => $categorias, 'message' => '']);
