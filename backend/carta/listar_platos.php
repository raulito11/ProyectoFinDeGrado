<?php
header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
    exit;
}

if ($_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No tienes permiso para hacer esto']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// filtro opcional por categoría
$id_categoria = isset($_GET['id_categoria']) ? (int)$_GET['id_categoria'] : null;

// hago JOIN con categorias para devolver el nombre de la categoría
if ($id_categoria !== null) {
    $sql = "SELECT p.id_plato, p.id_categoria, c.nombre AS nombre_categoria,
                   p.nombre, p.descripcion, p.precio, p.activo
            FROM platos p
            JOIN categorias c ON p.id_categoria = c.id_categoria
            WHERE p.id_categoria = :id_categoria
            ORDER BY p.id_categoria ASC, p.id_plato ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_categoria' => $id_categoria]);
} else {
    $sql = "SELECT p.id_plato, p.id_categoria, c.nombre AS nombre_categoria,
                   p.nombre, p.descripcion, p.precio, p.activo
            FROM platos p
            JOIN categorias c ON p.id_categoria = c.id_categoria
            ORDER BY p.id_categoria ASC, p.id_plato ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
}

$platos = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'data' => $platos, 'message' => '']);
