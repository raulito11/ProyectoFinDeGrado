<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

session_start();
require_once __DIR__ . '/../config/db.php';

// solo acepto GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// solo el admin puede listar usuarios
if (empty($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit;
}

if ($_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No tienes permisos para esta acción']);
    exit;
}

try {
    // traigo todos los usuarios con su rol, sin el campo password
    $stmt = $pdo->prepare("
        SELECT u.id_usuario, u.nombre, u.apellidos, u.email, u.telefono,
               u.id_rol, r.nombre AS nombre_rol
        FROM usuarios u
        JOIN roles r ON u.id_rol = r.id_rol
        ORDER BY u.id_usuario ASC
    ");
    $stmt->execute();
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data'    => $usuarios,
        'message' => ''
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener los usuarios']);
}
