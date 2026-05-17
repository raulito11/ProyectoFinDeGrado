<?php
header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/../config/db.php';

// compruebo que haya sesión activa
if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
    exit;
}

// solo el admin puede crear cierres
if ($_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
    exit;
}

// solo acepto POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// recojo los datos que me mandan
$datos = json_decode(file_get_contents('php://input'), true);

// compruebo que llegue la fecha
if (empty($datos['fecha'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El campo fecha es obligatorio']);
    exit;
}

$fecha = trim($datos['fecha']);

// valido que el formato de fecha sea YYYY-MM-DD
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El formato de fecha debe ser YYYY-MM-DD']);
    exit;
}

// también compruebo que la fecha sea válida de verdad (ej: no 2026-13-45)
$fecha_obj = DateTime::createFromFormat('Y-m-d', $fecha);
if (!$fecha_obj || $fecha_obj->format('Y-m-d') !== $fecha) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La fecha no es válida']);
    exit;
}

// el motivo es opcional
$motivo = isset($datos['motivo']) ? trim($datos['motivo']) : null;

// intento insertar el cierre y cancelar las reservas del día en una transacción
try {
    $pdo->beginTransaction();

    $sql = "INSERT INTO cierres (fecha, motivo) VALUES (:fecha, :motivo)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':fecha' => $fecha, ':motivo' => $motivo]);

    $id_cierre = $pdo->lastInsertId();

    // comprobar si hay reservas activas ese día antes de lanzar el UPDATE
    $sql_contar = "
        SELECT COUNT(*) FROM reservas
        WHERE fecha = :fecha
          AND estado IN ('pendiente', 'confirmada')
    ";
    $stmt_contar = $pdo->prepare($sql_contar);
    $stmt_contar->execute([':fecha' => $fecha]);
    $total = (int) $stmt_contar->fetchColumn();

    $reservas_canceladas = 0;
    if ($total > 0) {
        $sql_cancelar = "
            UPDATE reservas
            SET estado = 'cancelada'
            WHERE fecha = :fecha
              AND estado IN ('pendiente', 'confirmada')
        ";
        $stmt_cancelar = $pdo->prepare($sql_cancelar);
        $stmt_cancelar->execute([':fecha' => $fecha]);
        $reservas_canceladas = $stmt_cancelar->rowCount();
    }

    $pdo->commit();

    echo json_encode([
        'success'             => true,
        'message'             => 'Cierre creado',
        'id_cierre'           => (int) $id_cierre,
        'reservas_canceladas' => $reservas_canceladas
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    // código 23000 = violación de restricción de unicidad (fecha duplicada)
    if ($e->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Ya existe un cierre para esa fecha']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al crear el cierre']);
    }
}
