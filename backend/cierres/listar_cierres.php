<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
session_start();

require_once __DIR__ . '/../../config/db.php';

// compruebo que haya sesión activa
if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
    exit;
}

// solo el admin puede ver los cierres
if ($_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
    exit;
}

// solo acepto GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// obtengo todos los cierres ordenados por fecha
$sql = "SELECT id_cierre, fecha, motivo FROM cierres ORDER BY fecha ASC";
$stmt = $pdo->prepare($sql);
$stmt->execute();
$cierres = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'cierres' => $cierres]);
