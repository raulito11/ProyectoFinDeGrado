<?php
header('Content-Type: application/json');
session_start();
require_once __DIR__ . '/../config/db.php';

// Solo admin
if (!isset($_SESSION['id']) || $_SESSION['rol'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']);
    exit;
}

$semana_inicio = isset($_GET['semana_inicio']) ? trim($_GET['semana_inicio']) : '';

if (!$semana_inicio || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $semana_inicio)) {
    echo json_encode(['success' => false, 'message' => 'Fecha de semana no válida.']);
    exit;
}

// Calcular los 7 días de la semana (lunes a domingo)
$dias = [];
for ($i = 0; $i < 7; $i++) {
    $d = new DateTime($semana_inicio);
    $d->modify("+$i days");
    $dias[] = $d->format('Y-m-d');
}

// Obtener todos los empleados activos (camarero y jefe_sala)
$stmt = $pdo->prepare("
    SELECT u.id_usuario, u.nombre, u.apellidos, r.nombre AS rol
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    WHERE r.nombre IN ('camarero', 'jefe_sala') AND u.activo = 1
    ORDER BY r.nombre ASC, u.nombre ASC
");
$stmt->execute();
$empleados = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($empleados)) {
    echo json_encode(['success' => true, 'data' => []]);
    exit;
}

// Obtener los registros guardados para esa semana
$ids = array_column($empleados, 'id_usuario');
$placeholders = implode(',', array_fill(0, count($ids), '?'));

$stmt = $pdo->prepare("
    SELECT empleado_id, fecha, estado
    FROM horarios_empleados
    WHERE empleado_id IN ($placeholders)
      AND fecha BETWEEN ? AND ?
");
$params = array_merge($ids, [$dias[0], $dias[6]]);
$stmt->execute($params);
$registros = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Indexar por empleado_id + fecha
$mapa = [];
foreach ($registros as $r) {
    $mapa[$r['empleado_id']][$r['fecha']] = $r['estado'];
}

// Montar la respuesta con los 7 días de cada empleado
$resultado = [];
foreach ($empleados as $emp) {
    $dias_estado = [];
    foreach ($dias as $fecha) {
        // Si no hay registro guardado, el valor por defecto es 'trabajo'
        $estado = isset($mapa[$emp['id_usuario']][$fecha])
                  ? $mapa[$emp['id_usuario']][$fecha]
                  : 'trabajo';
        $dias_estado[] = ['fecha' => $fecha, 'estado' => $estado];
    }

    $resultado[] = [
        'id_usuario' => $emp['id_usuario'],
        'nombre'     => $emp['nombre'],
        'apellidos'  => $emp['apellidos'],
        'rol'        => $emp['rol'],
        'dias'       => $dias_estado,
    ];
}

echo json_encode(['success' => true, 'data' => $resultado]);
