<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$anio = isset($_GET['anio']) ? (int) $_GET['anio'] : (int) date('Y');
$mes  = isset($_GET['mes'])  ? (int) $_GET['mes']  : (int) date('n');

// Validar rango
if ($anio < 2000 || $anio > 2100 || $mes < 1 || $mes > 12) {
    echo json_encode(['success' => false, 'message' => 'Parámetros inválidos']);
    exit;
}

$fecha_inicio = sprintf('%04d-%02d-01', $anio, $mes);
$fecha_fin    = date('Y-m-t', strtotime($fecha_inicio)); // último día del mes

try {
    $stmt = $pdo->prepare("
        SELECT fecha
        FROM cierres
        WHERE fecha BETWEEN :inicio AND :fin
        ORDER BY fecha ASC
    ");
    $stmt->execute([':inicio' => $fecha_inicio, ':fin' => $fecha_fin]);
    $cierres = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode(['success' => true, 'cierres' => $cierres]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error al obtener los días cerrados']);
}
