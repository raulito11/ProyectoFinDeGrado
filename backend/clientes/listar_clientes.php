<?php
header('Content-Type: application/json');
session_start();
require_once __DIR__ . '/../config/db.php';

// solo acepto GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// solo el admin puede ver los clientes
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

// filtros opcionales de fecha
$desde = isset($_GET['desde']) ? trim($_GET['desde']) : '';
$hasta = isset($_GET['hasta']) ? trim($_GET['hasta']) : '';

// validar formato YYYY-MM-DD antes de usarlos en la query
$usarFiltro = false;
if ($desde !== '' && $hasta !== '') {
    $fechaDesde = DateTime::createFromFormat('Y-m-d', $desde);
    $fechaHasta = DateTime::createFromFormat('Y-m-d', $hasta);
    if ($fechaDesde && $fechaHasta
        && $fechaDesde->format('Y-m-d') === $desde
        && $fechaHasta->format('Y-m-d') === $hasta) {
        $usarFiltro = true;
    }
}

try {
    if ($usarFiltro) {
        $stmt = $pdo->prepare("
            SELECT u.id_usuario, u.nombre, u.apellidos, u.email, u.telefono, u.created_at
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id_rol
            WHERE r.nombre = 'cliente'
              AND DATE(u.created_at) BETWEEN ? AND ?
            ORDER BY u.created_at DESC
        ");
        $stmt->execute([$desde, $hasta]);
    } else {
        $stmt = $pdo->prepare("
            SELECT u.id_usuario, u.nombre, u.apellidos, u.email, u.telefono, u.created_at
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id_rol
            WHERE r.nombre = 'cliente'
            ORDER BY u.created_at DESC
        ");
        $stmt->execute();
    }

    $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data'    => $clientes,
        'total'   => count($clientes),
        'message' => ''
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener los clientes']);
}
