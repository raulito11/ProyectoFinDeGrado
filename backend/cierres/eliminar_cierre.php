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

// solo el admin puede eliminar cierres
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

// compruebo que llegue el id_cierre
if (empty($datos['id_cierre'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El campo id_cierre es obligatorio']);
    exit;
}

$id_cierre = (int) $datos['id_cierre'];

// compruebo que el cierre exista antes de borrarlo
$sql_check = "SELECT id_cierre FROM cierres WHERE id_cierre = :id_cierre";
$stmt_check = $pdo->prepare($sql_check);
$stmt_check->execute([':id_cierre' => $id_cierre]);
$cierre = $stmt_check->fetch(PDO::FETCH_ASSOC);

if (!$cierre) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'El cierre no existe']);
    exit;
}

// elimino el cierre
$sql_delete = "DELETE FROM cierres WHERE id_cierre = :id_cierre";
$stmt_delete = $pdo->prepare($sql_delete);
$stmt_delete->execute([':id_cierre' => $id_cierre]);

echo json_encode(['success' => true, 'message' => 'Cierre eliminado']);
