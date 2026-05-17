<?php
header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/../config/db.php';

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
