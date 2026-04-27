<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
session_start();

require_once __DIR__ . '/../config/db.php';

// solo acepto POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// compruebo que haya sesión activa
if (empty($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
    exit;
}

// solo el admin puede modificar reservas desde aquí
if ($_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No tienes permiso para realizar esta acción']);
    exit;
}

// recojo el JSON que me manda el frontend
$datos = json_decode(file_get_contents('php://input'), true);

// compruebo que me lleguen los campos obligatorios
if (empty($datos['id_reserva'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Falta el id de la reserva']);
    exit;
}

if (empty($datos['estado'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Falta el estado']);
    exit;
}

$id_reserva = (int) $datos['id_reserva'];
$estado     = trim($datos['estado']);

// el admin solo puede poner confirmada o cancelada (no volver a pendiente)
$estados_validos = ['confirmada', 'cancelada'];

if (!in_array($estado, $estados_validos)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Estado no válido. Solo se permite: confirmada, cancelada']);
    exit;
}

try {
    // primero compruebo que la reserva existe
    $stmt = $pdo->prepare("
        SELECT id_reserva, estado
        FROM reservas
        WHERE id_reserva = :id_reserva
    ");
    $stmt->execute([':id_reserva' => $id_reserva]);

    $reserva = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reserva) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Reserva no encontrada']);
        exit;
    }

    // actualizo el estado de la reserva
    $stmt = $pdo->prepare("
        UPDATE reservas
        SET estado = :estado
        WHERE id_reserva = :id_reserva
    ");
    $stmt->execute([
        ':estado'     => $estado,
        ':id_reserva' => $id_reserva,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Reserva actualizada correctamente',
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
