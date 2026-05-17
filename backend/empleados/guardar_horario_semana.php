<?php
header('Content-Type: application/json');
session_start();
require_once __DIR__ . '/../config/db.php';

// Solo admin
if (!isset($_SESSION['id']) || $_SESSION['rol'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']);
    exit;
}

$datos = json_decode(file_get_contents('php://input'), true);

if (!isset($datos['horarios']) || !is_array($datos['horarios'])) {
    echo json_encode(['success' => false, 'message' => 'Datos no válidos.']);
    exit;
}

$horarios = $datos['horarios'];

if (empty($horarios)) {
    echo json_encode(['success' => false, 'message' => 'No hay datos para guardar.']);
    exit;
}

// UPSERT: INSERT ... ON DUPLICATE KEY UPDATE
$stmt = $pdo->prepare("
    INSERT INTO horarios_empleados (empleado_id, fecha, estado)
    VALUES (:empleado_id, :fecha, :estado)
    ON DUPLICATE KEY UPDATE
        estado     = VALUES(estado),
        updated_at = CURRENT_TIMESTAMP
");

try {
    $pdo->beginTransaction();

    foreach ($horarios as $h) {
        if (!isset($h['empleado_id'], $h['fecha'], $h['estado'])) continue;
        if (!in_array($h['estado'], ['trabajo', 'libre'])) continue;
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $h['fecha'])) continue;

        $stmt->execute([
            ':empleado_id' => (int) $h['empleado_id'],
            ':fecha'       => $h['fecha'],
            ':estado'      => $h['estado'],
        ]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Horario guardado correctamente.']);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error al guardar el horario.']);
}
