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

// solo el admin puede ver los horarios
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

// obtengo todos los slots de la tabla horarios
$sql = "SELECT id_horario, hora_inicio, hora_fin, activo FROM horarios ORDER BY hora_inicio ASC";
$stmt = $pdo->prepare($sql);
$stmt->execute();
$horarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'horarios' => $horarios]);
