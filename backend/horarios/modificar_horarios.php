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

// solo el admin puede modificar horarios
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

// compruebo que lleguen los campos necesarios
if (!isset($datos['id_horario']) || !isset($datos['activo'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios: id_horario y activo']);
    exit;
}

$id_horario = (int) $datos['id_horario'];
$activo = (int) $datos['activo'];

// activo solo puede ser 0 o 1
if ($activo !== 0 && $activo !== 1) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El campo activo solo puede ser 0 o 1']);
    exit;
}

// compruebo que el horario exista
$sql_check = "SELECT id_horario FROM horarios WHERE id_horario = :id_horario";
$stmt_check = $pdo->prepare($sql_check);
$stmt_check->execute([':id_horario' => $id_horario]);
$horario = $stmt_check->fetch(PDO::FETCH_ASSOC);

if (!$horario) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'El horario no existe']);
    exit;
}

// actualizo el campo activo
$sql_update = "UPDATE horarios SET activo = :activo WHERE id_horario = :id_horario";
$stmt_update = $pdo->prepare($sql_update);
$stmt_update->execute([
    ':activo'     => $activo,
    ':id_horario' => $id_horario
]);

echo json_encode(['success' => true, 'message' => 'Horario actualizado']);
