<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
session_start();

require_once __DIR__ . '/../../config/db.php';

// solo acepto GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// compruebo que haya sesión activa
if (empty($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
    exit;
}

// solo el admin puede ver las estadísticas
if ($_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
    exit;
}

// la fecha de hoy y la de dentro de 7 días
$hoy           = date('Y-m-d');
$en_siete_dias = date('Y-m-d', strtotime('+7 days'));

try {

    // --- 1. reservas_hoy ---
    // cuántas reservas hay para hoy (cualquier estado)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS total
        FROM reservas
        WHERE fecha = :hoy
    ");
    $stmt->execute([':hoy' => $hoy]);
    $reservas_hoy = (int) $stmt->fetchColumn();


    // --- 2. reservas_semana ---
    // reservas desde hoy hasta dentro de 7 días (cualquier estado)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS total
        FROM reservas
        WHERE fecha BETWEEN :hoy AND :en_siete_dias
    ");
    $stmt->execute([
        ':hoy'           => $hoy,
        ':en_siete_dias' => $en_siete_dias,
    ]);
    $reservas_semana = (int) $stmt->fetchColumn();


    // --- 3. reservas_por_estado ---
    // cuántas reservas hay de cada estado, sin filtro de fecha
    $stmt = $pdo->prepare("
        SELECT estado, COUNT(*) AS total
        FROM reservas
        GROUP BY estado
    ");
    $stmt->execute();
    $filas_estado = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // empiezo con todos a 0 por si algún estado no tiene ninguna reserva
    $reservas_por_estado = [
        'pendiente'  => 0,
        'confirmada' => 0,
        'cancelada'  => 0,
    ];

    foreach ($filas_estado as $fila) {
        if (isset($reservas_por_estado[$fila['estado']])) {
            $reservas_por_estado[$fila['estado']] = (int) $fila['total'];
        }
    }


    // --- 4. aforo_hoy ---
    // para cada slot activo de hoy, calculo la capacidad máxima, ocupada y libre

    // primero saco los slots que están activos en la tabla horarios
    $stmt = $pdo->prepare("
        SELECT hora_inicio
        FROM horarios
        WHERE activo = 1
        ORDER BY hora_inicio ASC
    ");
    $stmt->execute();
    $slots = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $aforo_hoy = [];

    foreach ($slots as $slot) {
        $hora = $slot['hora_inicio'];

        // busco si hay una fila en aforo para esta fecha y hora
        $stmt_aforo = $pdo->prepare("
            SELECT capacidad_total
            FROM aforo
            WHERE fecha = :fecha AND hora = :hora
        ");
        $stmt_aforo->execute([
            ':fecha' => $hoy,
            ':hora'  => $hora,
        ]);
        $fila_aforo = $stmt_aforo->fetch(PDO::FETCH_ASSOC);

        // si no existe fila en aforo, asumo 40 por defecto
        $capacidad_maxima = $fila_aforo ? (int) $fila_aforo['capacidad_total'] : 40;

        // sumo la capacidad ocupada por reservas pendientes o confirmadas en este slot
        $stmt_ocupada = $pdo->prepare("
            SELECT COALESCE(SUM(br.capacidad_asignada), 0) AS ocupada
            FROM bloques_reserva br
            JOIN reservas r ON br.id_reserva = r.id_reserva
            WHERE br.fecha = :fecha
              AND br.hora_inicio = :hora
              AND r.estado IN ('pendiente', 'confirmada')
        ");
        $stmt_ocupada->execute([
            ':fecha' => $hoy,
            ':hora'  => $hora,
        ]);
        $capacidad_ocupada = (int) $stmt_ocupada->fetchColumn();

        $aforo_hoy[] = [
            'hora'              => $hora,
            'capacidad_maxima'  => $capacidad_maxima,
            'capacidad_ocupada' => $capacidad_ocupada,
            'capacidad_libre'   => $capacidad_maxima - $capacidad_ocupada,
        ];
    }


    // devuelvo todos los KPIs juntos
    echo json_encode([
        'success'             => true,
        'reservas_hoy'        => $reservas_hoy,
        'reservas_semana'     => $reservas_semana,
        'reservas_por_estado' => $reservas_por_estado,
        'aforo_hoy'           => $aforo_hoy,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
