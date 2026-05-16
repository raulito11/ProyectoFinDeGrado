<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// traigo todas las categorías con sus platos activos, ordenadas por 'orden'
$sql = "SELECT c.id_categoria, c.nombre AS nombre_categoria, c.descripcion AS descripcion_categoria,
               p.id_plato, p.nombre, p.descripcion, p.precio, p.imagen
        FROM categorias c
        LEFT JOIN platos p ON p.id_categoria = c.id_categoria AND p.activo = 1
        ORDER BY c.orden ASC, c.id_categoria ASC, p.id_plato ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute();
$filas = $stmt->fetchAll(PDO::FETCH_ASSOC);

// agrupo los platos dentro de cada categoría
$categorias = [];
foreach ($filas as $fila) {
    $idCat = $fila['id_categoria'];

    if (!isset($categorias[$idCat])) {
        $categorias[$idCat] = [
            'id_categoria'          => $idCat,
            'nombre'                => $fila['nombre_categoria'],
            'descripcion'           => $fila['descripcion_categoria'],
            'platos'                => []
        ];
    }

    // solo añadir el plato si existe (LEFT JOIN puede traer NULL si no hay platos)
    if ($fila['id_plato'] !== null) {
        $categorias[$idCat]['platos'][] = [
            'id_plato'    => $fila['id_plato'],
            'nombre'      => $fila['nombre'],
            'descripcion' => $fila['descripcion'],
            'precio'      => $fila['precio'],
            'imagen'      => $fila['imagen']
        ];
    }
}

echo json_encode(['success' => true, 'data' => array_values($categorias)]);
