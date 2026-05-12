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

// Con FormData los datos llegan en $_POST
if (empty($_POST['id_plato'])) {
    echo json_encode(['success' => false, 'message' => 'El campo id_plato es obligatorio']);
    exit;
}

$id_plato = (int)$_POST['id_plato'];

// validar precio si llega
if (isset($_POST['precio']) && (float)$_POST['precio'] <= 0) {
    echo json_encode(['success' => false, 'message' => 'El precio debe ser mayor que 0']);
    exit;
}

// si llega id_categoria, comprobar que exista
if (isset($_POST['id_categoria'])) {
    $sqlCat = "SELECT id_categoria FROM categorias WHERE id_categoria = :id_categoria";
    $stmtCat = $pdo->prepare($sqlCat);
    $stmtCat->execute([':id_categoria' => (int)$_POST['id_categoria']]);

    if (!$stmtCat->fetch()) {
        echo json_encode(['success' => false, 'message' => 'La categoría indicada no existe']);
        exit;
    }
}

// construyo el UPDATE dinámico con los campos que llegaron
$campos = [];
$params = [':id_plato' => $id_plato];

if (isset($_POST['nombre'])) {
    $campos[] = 'nombre = :nombre';
    $params[':nombre'] = trim($_POST['nombre']);
}
if (isset($_POST['descripcion'])) {
    $campos[] = 'descripcion = :descripcion';
    $params[':descripcion'] = trim($_POST['descripcion']);
}
if (isset($_POST['precio'])) {
    $campos[] = 'precio = :precio';
    $params[':precio'] = (float)$_POST['precio'];
}
if (isset($_POST['activo'])) {
    $campos[] = 'activo = :activo';
    $params[':activo'] = (int)$_POST['activo'];
}
if (isset($_POST['id_categoria'])) {
    $campos[] = 'id_categoria = :id_categoria';
    $params[':id_categoria'] = (int)$_POST['id_categoria'];
}
if (isset($_POST['destacado'])) {
    $destacado = (int)$_POST['destacado'];

    // máximo 3 platos destacados al mismo tiempo
    if ($destacado === 1) {
        $stmtDest = $pdo->prepare("SELECT COUNT(*) FROM platos WHERE destacado = 1 AND id_plato != :id_plato");
        $stmtDest->execute([':id_plato' => $id_plato]);
        if ((int)$stmtDest->fetchColumn() >= 3) {
            echo json_encode(['success' => false, 'message' => 'Ya hay 3 platos destacados. Quita uno antes de añadir otro']);
            exit;
        }
    }

    $campos[] = 'destacado = :destacado';
    $params[':destacado'] = $destacado;
}

// gestión de la nueva imagen si se subió una
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

    $extension     = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
    $nombreArchivo = uniqid('plato_') . '.' . $extension;
    $carpeta       = __DIR__ . '/../../frontend/uploads/platos/';

    if (!is_dir($carpeta)) {
        mkdir($carpeta, 0755, true);
    }

    if (!move_uploaded_file($_FILES['imagen']['tmp_name'], $carpeta . $nombreArchivo)) {
        echo json_encode(['success' => false, 'message' => 'Error al guardar la imagen en el servidor']);
        exit;
    }

    $campos[] = 'imagen = :imagen';
    $params[':imagen'] = 'uploads/platos/' . $nombreArchivo;
}

if (empty($campos)) {
    echo json_encode(['success' => false, 'message' => 'No se enviaron campos para actualizar']);
    exit;
}

$sql = "UPDATE platos SET " . implode(', ', $campos) . " WHERE id_plato = :id_plato";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

if ($stmt->rowCount() === 0) {
    echo json_encode(['success' => false, 'message' => 'No se encontró el plato o no hubo cambios']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Plato actualizado']);
