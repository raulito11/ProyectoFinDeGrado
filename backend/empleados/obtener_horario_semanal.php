<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
session_start();

require_once __DIR__ . '/../../config/db.php';

// compruebo que haya sesión activa
if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
    exit;
}

// solo pueden acceder camarero y jefe_sala
$roles_permitidos = ['camarero', 'jefe_sala'];
if (!in_array($_SESSION['rol'], $roles_permitidos)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
    exit;
}

// solo acepto GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// calculo la fecha del lunes de esta semana
// date('N') devuelve 1=lunes, 7=domingo
$hoy = new DateTime();
$dia_semana_num = (int)$hoy->format('N'); // 1 = lunes, 7 = domingo
$dias_hasta_lunes = $dia_semana_num - 1;
$lunes = clone $hoy;
$lunes->modify("-{$dias_hasta_lunes} days");

// nombres de los días en español
$nombres_dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// obtengo todas las fechas de cierres para comparar después
$stmt_cierres = $pdo->prepare("SELECT fecha FROM cierres");
$stmt_cierres->execute();
$fechas_cierre = $stmt_cierres->fetchAll(PDO::FETCH_COLUMN);

// obtengo los slots activos de comida (13:00 - 17:00)
$stmt_comida = $pdo->prepare(
    "SELECT hora_inicio, hora_fin FROM horarios
     WHERE activo = 1
       AND hora_inicio >= '13:00:00'
       AND hora_inicio <= '16:59:59'
     ORDER BY hora_inicio ASC"
);
$stmt_comida->execute();
$slots_comida = $stmt_comida->fetchAll(PDO::FETCH_ASSOC);

// obtengo los slots activos de cena (20:00 - 00:00)
$stmt_cena = $pdo->prepare(
    "SELECT hora_inicio, hora_fin FROM horarios
     WHERE activo = 1
       AND hora_inicio >= '20:00:00'
       AND hora_inicio <= '23:59:59'
     ORDER BY hora_inicio ASC"
);
$stmt_cena->execute();
$slots_cena = $stmt_cena->fetchAll(PDO::FETCH_ASSOC);

// construyo el array con los 7 días de la semana
$semana = [];

for ($i = 0; $i < 7; $i++) {
    $dia = clone $lunes;
    $dia->modify("+{$i} days");

    $fecha_str = $dia->format('Y-m-d');

    $semana[] = [
        'fecha'       => $fecha_str,
        'dia_semana'  => $nombres_dias[$i],
        'es_cierre'   => in_array($fecha_str, $fechas_cierre),
        'slots_comida' => $slots_comida,
        'slots_cena'   => $slots_cena,
    ];
}

echo json_encode(['success' => true, 'semana' => $semana]);
