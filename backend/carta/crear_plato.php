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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Con FormData los datos llegan en $_POST (no en php://input)
if (empty($_POST['id_categoria']) || empty($_POST['nombre']) || !isset($_POST['precio'])) {
    echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios: id_categoria, nombre y precio']);
    exit;
}

$id_categoria = (int)$_POST['id_categoria'];
$nombre       = trim($_POST['nombre']);
$descripcion  = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : null;
$precio       = (float)$_POST['precio'];

if ($precio <= 0) {
    echo json_encode(['success' => false, 'message' => 'El precio debe ser mayor que 0']);
    exit;
}

// comprobar que la categoría exista
$sqlCat = "SELECT id_categoria FROM categorias WHERE id_categoria = :id_categoria";
$stmtCat = $pdo->prepare($sqlCat);
$stmtCat->execute([':id_categoria' => $id_categoria]);

if (!$stmtCat->fetch()) {
    echo json_encode(['success' => false, 'message' => 'La categoría indicada no existe']);
    exit;
}

// gestión de la imagen subida
$rutaImagen = null;

if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
    $tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    $tamanoMaximo    = 2 * 1024 * 1024; // 2 MB

    if (!in_array($_FILES['imagen']['type'], $tiposPermitidos)) {
        echo json_encode(['success' => false, 'message' => 'Solo se permiten imágenes JPG, PNG, WEBP o GIF']);
        exit;
    }

    if ($_FILES['imagen']['size'] > $tamanoMaximo) {
        echo json_encode(['success' => false, 'message' => 'La imagen no puede superar los 2 MB']);
        exit;
    }

    $extension      = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
    $nombreArchivo  = uniqid('plato_') . '.' . $extension;
    $carpeta        = __DIR__ . '/../../frontend/uploads/platos/';

    if (!is_dir($carpeta)) {
        mkdir($carpeta, 0755, true);
    }

    if (!move_uploaded_file($_FILES['imagen']['tmp_name'], $carpeta . $nombreArchivo)) {
        echo json_encode(['success' => false, 'message' => 'Error al guardar la imagen en el servidor']);
        exit;
    }

    $rutaImagen = 'uploads/platos/' . $nombreArchivo;
}

$sql = "INSERT INTO platos (id_categoria, nombre, descripcion, precio, imagen, activo)
        VALUES (:id_categoria, :nombre, :descripcion, :precio, :imagen, 1)";

$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':id_categoria' => $id_categoria,
    ':nombre'       => $nombre,
    ':descripcion'  => $descripcion,
    ':precio'       => $precio,
    ':imagen'       => $rutaImagen
]);

$id_nuevo = $pdo->lastInsertId();

echo json_encode(['success' => true, 'id_plato' => (int)$id_nuevo]);
