<?php
header('Content-Type: application/json');
session_start();
require_once __DIR__ . '/../config/db.php';

// Solo camarero y jefe_sala
if (!isset($_SESSION['id'])) {
    echo json_encode(['success' => false, 'message' => 'Sesión no iniciada.']);
    exit;
}

if (!in_array($_SESSION['rol'], ['camarero', 'jefe_sala'])) {
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']);
    exit;
}

$id_empleado = (int) $_SESSION['id'];

// Semana pedida por el cliente o la actual si no viene parámetro
$semana_inicio = isset($_GET['semana_inicio']) ? trim($_GET['semana_inicio']) : '';

if (!$semana_inicio || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $semana_inicio)) {
    // Calcular el lunes de la semana actual
    $hoy = new DateTime();
    $dia_semana = (int) $hoy->format('N');
    $hoy->modify('-' . ($dia_semana - 1) . ' days');
    $semana_inicio = $hoy->format('Y-m-d');
}

// Calcular los 7 días de la semana
$dias = [];
for ($i = 0; $i < 7; $i++) {
    $d = new DateTime($semana_inicio);
    $d->modify("+$i days");
    $dias[] = $d->format('Y-m-d');
}

// Obtener los estados del empleado para esta semana
try {
    $stmt = $pdo->prepare("
        SELECT fecha, estado
        FROM horarios_empleados
        WHERE empleado_id = :id
          AND fecha BETWEEN :inicio AND :fin
    ");
    $stmt->execute([
        ':id'     => $id_empleado,
        ':inicio' => $dias[0],
        ':fin'    => $dias[6],
    ]);
    $registros = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()]);
    exit;
}

// Si no hay ningún registro, el horario no está publicado
if (empty($registros)) {
    echo json_encode([
        'success'       => true,
        'publicado'     => false,
        'semana_inicio' => $semana_inicio,
        'dias'          => [],
    ]);
    exit;
}

// Indexar por fecha
$mapa = [];
foreach ($registros as $r) {
    $mapa[$r['fecha']] = $r['estado'];
}

$nombres_dia = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

$resultado = [];
foreach ($dias as $i => $fecha) {
    $resultado[] = [
        'fecha'      => $fecha,
        'dia_semana' => $nombres_dia[$i],
        'estado'     => isset($mapa[$fecha]) ? $mapa[$fecha] : 'trabajo',
    ];
}

echo json_encode([
    'success'       => true,
    'publicado'     => true,
    'semana_inicio' => $semana_inicio,
    'dias'          => $resultado,
]);
