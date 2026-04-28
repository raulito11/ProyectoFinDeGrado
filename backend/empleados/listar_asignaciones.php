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

// solo pueden acceder camarero y jefe_sala
$roles_permitidos = ['camarero', 'jefe_sala'];
if (!in_array($_SESSION['rol'], $roles_permitidos)) {
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

// si me mandan una fecha la uso, si no uso hoy
if (!empty($_GET['fecha'])) {
    $fecha = trim($_GET['fecha']);

    // valido el formato YYYY-MM-DD
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Formato de fecha no válido, usa YYYY-MM-DD']);
        exit;
    }
} else {
    $fecha = date('Y-m-d');
}

// obtengo todas las reservas de esa fecha que no estén canceladas
$stmt = $pdo->prepare(
    "SELECT id_reserva, nombre, apellidos, hora_inicio, hora_fin,
            num_personas, estado, numero_mesa
     FROM reservas
     WHERE fecha = :fecha
       AND estado != 'cancelada'
     ORDER BY hora_inicio ASC"
);
$stmt->execute([':fecha' => $fecha]);
$reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'success'  => true,
    'fecha'    => $fecha,
    'reservas' => $reservas,
]);
