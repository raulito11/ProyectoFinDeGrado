<?php
header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
    exit;
}

if ($_SESSION['rol'] !== 'jefe_sala') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
    exit;
}

$stmt = $pdo->prepare("
    SELECT u.id_usuario, u.nombre, u.apellidos
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    WHERE r.nombre = 'camarero'
      AND u.activo = 1
    ORDER BY u.nombre ASC
");
$stmt->execute();
$camareros = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'camareros' => $camareros]);
