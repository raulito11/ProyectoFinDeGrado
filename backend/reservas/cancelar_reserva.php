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

// solo los clientes pueden cancelar sus propias reservas
if ($_SESSION['rol'] !== 'cliente') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No tienes permiso para realizar esta acción']);
    exit;
}

// recojo el JSON que me manda el frontend
$datos = json_decode(file_get_contents('php://input'), true);

if (empty($datos['id_reserva'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Falta el id de la reserva']);
    exit;
}

$id_reserva = (int) $datos['id_reserva'];
$id_usuario = (int) $_SESSION['id'];

try {
    // busco la reserva para ver si existe y si le pertenece al usuario en sesión
    $stmt = $pdo->prepare("
        SELECT id_reserva, estado
        FROM reservas
        WHERE id_reserva = :id_reserva AND id_usuario = :id_usuario
    ");
    $stmt->execute([
        ':id_reserva' => $id_reserva,
        ':id_usuario' => $id_usuario,
    ]);

    $reserva = $stmt->fetch(PDO::FETCH_ASSOC);

    // si no la encuentro, o no le pertenece, devuelvo error
    if (!$reserva) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'La reserva no existe o no te pertenece']);
        exit;
    }

    // compruebo que no esté ya cancelada
    if ($reserva['estado'] === 'cancelada') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'La reserva ya está cancelada']);
        exit;
    }

    // solo se puede cancelar si está pendiente o confirmada (que es lo que queda, pero lo dejo explícito)
    if (!in_array($reserva['estado'], ['pendiente', 'confirmada'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Esta reserva no se puede cancelar']);
        exit;
    }

    // actualizo el estado a cancelada
    $stmt = $pdo->prepare("
        UPDATE reservas
        SET estado = 'cancelada'
        WHERE id_reserva = :id_reserva
    ");
    $stmt->execute([':id_reserva' => $id_reserva]);

    echo json_encode([
        'success' => true,
        'message' => 'Reserva cancelada correctamente',
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
