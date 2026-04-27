<?php
header('Content-Type: application/json');
session_start();

// Al definir esta constante antes de incluir verificar_disponibilidad.php,
// evitamos que ejecute el código de endpoint y solo cargamos la función.
define('INCLUIDO_COMO_FUNCION', true);
require_once __DIR__ . '/verificar_disponibilidad.php';
require_once __DIR__ . '/../config/db.php';

// --- Solo acepto POST ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// --- Requiero sesión activa con rol cliente ---
if (empty($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión para hacer una reserva']);
    exit;
}

if ($_SESSION['rol'] !== 'cliente') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Solo los clientes pueden crear reservas']);
    exit;
}

// --- Recojo y valido los datos ---
$datos = json_decode(file_get_contents('php://input'), true);

if (empty($datos['fecha']) || empty($datos['hora_inicio']) || !isset($datos['num_personas'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios']);
    exit;
}

$fecha        = $datos['fecha'];
$hora_inicio  = $datos['hora_inicio'];
$num_personas = (int) $datos['num_personas'];

if ($num_personas < 1 || $num_personas > 20) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El número de personas debe estar entre 1 y 20']);
    exit;
}

// Regla del sistema: CEIL(num_personas / 2) * 2
$capacidad_asignada = (int) ceil($num_personas / 2) * 2;

// hora_fin = hora_inicio + 2 horas
$hora_fin = date('H:i:s', strtotime($hora_inicio) + 2 * 3600);

try {
    // --- Verifico disponibilidad (reutilizo la función de verificar_disponibilidad.php) ---
    $resultado = verificar_disponibilidad_interna($pdo, $fecha, $hora_inicio, $capacidad_asignada);

    if (!$resultado['disponible']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $resultado['motivo']]);
        exit;
    }

    // --- Obtengo los datos del usuario en sesión ---
    $stmt = $pdo->prepare("
        SELECT nombre, apellidos, telefono, email
        FROM usuarios
        WHERE id_usuario = :id_usuario
    ");
    $stmt->execute([':id_usuario' => $_SESSION['id']]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No se encontró el usuario en la base de datos']);
        exit;
    }

    // --- Transacción: INSERT en reservas + 4 INSERTs en bloques_reserva ---
    $pdo->beginTransaction();

    // 1. Inserto la reserva
    $stmt = $pdo->prepare("
        INSERT INTO reservas
            (id_usuario, nombre, apellidos, telefono, email,
             fecha, hora_inicio, hora_fin, num_personas, capacidad_asignada, estado)
        VALUES
            (:id_usuario, :nombre, :apellidos, :telefono, :email,
             :fecha, :hora_inicio, :hora_fin, :num_personas, :capacidad_asignada, 'pendiente')
    ");
    $stmt->execute([
        ':id_usuario'         => $_SESSION['id'],
        ':nombre'             => $usuario['nombre'],
        ':apellidos'          => $usuario['apellidos'],
        ':telefono'           => $usuario['telefono'],
        ':email'              => $usuario['email'],
        ':fecha'              => $fecha,
        ':hora_inicio'        => $hora_inicio,
        ':hora_fin'           => $hora_fin,
        ':num_personas'       => $num_personas,
        ':capacidad_asignada' => $capacidad_asignada,
    ]);

    $id_reserva = $pdo->lastInsertId();

    // 2. Inserto los 4 bloques de 30 min
    $base = strtotime($hora_inicio);

    for ($i = 0; $i < 4; $i++) {
        $hora_bloque_inicio = date('H:i:s', $base + ($i * 30 * 60));
        $hora_bloque_fin    = date('H:i:s', $base + (($i + 1) * 30 * 60));

        $stmt = $pdo->prepare("
            INSERT INTO bloques_reserva
                (id_reserva, fecha, hora_inicio, hora_fin, capacidad_asignada)
            VALUES
                (:id_reserva, :fecha, :hora_inicio, :hora_fin, :capacidad_asignada)
        ");
        $stmt->execute([
            ':id_reserva'         => $id_reserva,
            ':fecha'              => $fecha,
            ':hora_inicio'        => $hora_bloque_inicio,
            ':hora_fin'           => $hora_bloque_fin,
            ':capacidad_asignada' => $capacidad_asignada,
        ]);
    }

    $pdo->commit();

    echo json_encode([
        'success'    => true,
        'message'    => 'Reserva creada correctamente',
        'id_reserva' => (int) $id_reserva,
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
