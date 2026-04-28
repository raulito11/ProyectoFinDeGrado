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

// solo el jefe_sala puede asignar mesas
if ($_SESSION['rol'] !== 'jefe_sala') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Solo el jefe de sala puede asignar mesas']);
    exit;
}

// solo acepto POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// recojo los datos del cuerpo de la petición
$datos = json_decode(file_get_contents('php://input'), true);

// compruebo que lleguen los dos campos necesarios
if (empty($datos['id_reserva']) || !isset($datos['numero_mesa'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios: id_reserva y numero_mesa']);
    exit;
}

$id_reserva  = $datos['id_reserva'];
$numero_mesa = $datos['numero_mesa'];

// numero_mesa tiene que ser un entero mayor que 0
if (!is_int($numero_mesa) || $numero_mesa <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El número de mesa debe ser un entero mayor que 0']);
    exit;
}

// compruebo que la reserva existe
$stmt_buscar = $pdo->prepare("SELECT id_reserva, estado FROM reservas WHERE id_reserva = :id_reserva");
$stmt_buscar->execute([':id_reserva' => $id_reserva]);
$reserva = $stmt_buscar->fetch(PDO::FETCH_ASSOC);

if (!$reserva) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Reserva no encontrada']);
    exit;
}

// no se puede asignar mesa a una reserva cancelada
if ($reserva['estado'] === 'cancelada') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No se puede asignar mesa a una reserva cancelada']);
    exit;
}

// asigno la mesa
$stmt_update = $pdo->prepare(
    "UPDATE reservas SET numero_mesa = :numero_mesa WHERE id_reserva = :id_reserva"
);
$stmt_update->execute([
    ':numero_mesa' => $numero_mesa,
    ':id_reserva'  => $id_reserva,
]);

echo json_encode(['success' => true, 'message' => 'Mesa asignada correctamente']);
