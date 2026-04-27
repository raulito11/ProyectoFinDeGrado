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

// solo el admin puede ver todas las reservas
if ($_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No tienes permiso para realizar esta acción']);
    exit;
}

// recojo los filtros opcionales del query string
$fecha  = isset($_GET['fecha'])  ? trim($_GET['fecha'])  : null;
$estado = isset($_GET['estado']) ? trim($_GET['estado']) : null;

// los estados válidos del ENUM
$estados_validos = ['pendiente', 'confirmada', 'cancelada'];

// si me mandan un estado, compruebo que sea válido
if ($estado !== null && !in_array($estado, $estados_validos)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Estado no válido']);
    exit;
}

// valido el formato de la fecha si me la mandan
if ($fecha !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Formato de fecha no válido, usa YYYY-MM-DD']);
    exit;
}

try {
    // construyo la query base con JOIN para sacar el nombre del cliente
    $sql = "
        SELECT
            r.id_reserva,
            r.fecha,
            r.hora_inicio,
            r.hora_fin,
            r.num_personas,
            r.estado,
            r.created_at,
            CONCAT(u.nombre, ' ', u.apellidos) AS nombre_cliente,
            u.email AS email_cliente
        FROM reservas r
        LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
        WHERE 1=1
    ";

    // voy añadiendo condiciones solo si me mandan los filtros
    $params = [];

    if ($fecha !== null) {
        $sql .= " AND r.fecha = :fecha";
        $params[':fecha'] = $fecha;
    }

    if ($estado !== null) {
        $sql .= " AND r.estado = :estado";
        $params[':estado'] = $estado;
    }

    $sql .= " ORDER BY r.fecha DESC, r.hora_inicio DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'  => true,
        'reservas' => $reservas,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
