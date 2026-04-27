<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
session_start();

require_once __DIR__ . '/../config/db.php';

// solo acepto GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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

$id_usuario = (int) $_SESSION['id'];

try {
    // busco todas las reservas del usuario en sesión, de más reciente a más antigua
    $stmt = $pdo->prepare("
        SELECT id_reserva, fecha, hora_inicio, hora_fin,
               num_personas, estado, created_at
        FROM reservas
        WHERE id_usuario = :id_usuario
        ORDER BY fecha DESC, hora_inicio DESC
    ");
    $stmt->execute([':id_usuario' => $id_usuario]);

    $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'  => true,
        'reservas' => $reservas,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
