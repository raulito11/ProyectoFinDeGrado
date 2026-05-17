<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$sql = "SELECT p.id_plato, p.nombre, p.descripcion, p.precio, p.imagen, c.nombre AS nombre_categoria
        FROM platos p
        JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.destacado = 1 AND p.activo = 1
        ORDER BY p.id_plato ASC
        LIMIT 3";
$stmt = $pdo->prepare($sql);
$stmt->execute();
$platos = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'data' => $platos]);
