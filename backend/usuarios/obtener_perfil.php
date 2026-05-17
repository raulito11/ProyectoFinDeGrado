<?php
header('Content-Type: application/json');
session_start();

// solo usuarios autenticados
if (empty($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$id_usuario = (int) $_SESSION['id'];

try {
    $stmt = $pdo->prepare("
        SELECT nombre, apellidos, email, telefono
        FROM usuarios
        WHERE id_usuario = :id_usuario
        LIMIT 1
    ");
    $stmt->execute([':id_usuario' => $id_usuario]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit;
    }

    echo json_encode(['success' => true, 'data' => $usuario]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener el perfil']);
}
