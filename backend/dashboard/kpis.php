<?php
header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

if (empty($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
    exit;
}

if ($_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
    exit;
}

// Parámetros de filtro con valores por defecto al mes actual
$fecha_desde = $_GET['fecha_desde'] ?? date('Y-m-01');
$fecha_hasta = $_GET['fecha_hasta'] ?? date('Y-m-t');
$estado      = $_GET['estado']      ?? '';

// Validar formato de fechas
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha_desde) ||
    !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha_hasta)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Fechas no válidas']);
    exit;
}

// Whitelist de estados permitidos
$estados_validos = ['', 'pendiente', 'confirmada', 'cancelada'];
if (!in_array($estado, $estados_validos)) {
    $estado = '';
}

try {

    // --- 1. KPIs de reservas ---
    // Construyo la condición de estado de forma condicional para evitar reusar parámetros PDO
    $where_estado = $estado !== '' ? " AND estado = :estado" : '';

    $params_res = [':desde' => $fecha_desde, ':hasta' => $fecha_hasta];
    if ($estado !== '') {
        $params_res[':estado'] = $estado;
    }

    $stmt = $pdo->prepare("
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) AS confirmadas,
            SUM(CASE WHEN estado = 'pendiente'  THEN 1 ELSE 0 END) AS pendientes,
            SUM(CASE WHEN estado = 'cancelada'  THEN 1 ELSE 0 END) AS canceladas
        FROM reservas
        WHERE fecha BETWEEN :desde AND :hasta
        {$where_estado}
    ");
    $stmt->execute($params_res);
    $fila = $stmt->fetch(PDO::FETCH_ASSOC);

    $total       = (int) ($fila['total']       ?? 0);
    $confirmadas = (int) ($fila['confirmadas'] ?? 0);
    $pendientes  = (int) ($fila['pendientes']  ?? 0);
    $canceladas  = (int) ($fila['canceladas']  ?? 0);

    $tasa_cancelacion = $total > 0 ? round(($canceladas / $total) * 100, 1) : 0;


    // --- 2. Clientes únicos en el periodo (por email) ---
    $stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT email) AS total
        FROM reservas
        WHERE fecha BETWEEN :desde AND :hasta
        {$where_estado}
    ");
    $stmt->execute($params_res);
    $clientes_unicos = (int) $stmt->fetchColumn();


    // --- 3. Clientes nuevos: su primer reserva (por email, en toda la historia) cae dentro del rango ---
    $params_nuevos = [':desde' => $fecha_desde, ':hasta' => $fecha_hasta, ':desde_sub' => $fecha_desde];
    if ($estado !== '') {
        $params_nuevos[':estado'] = $estado;
    }

    $stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT r.email) AS nuevos
        FROM reservas r
        WHERE r.fecha BETWEEN :desde AND :hasta
        {$where_estado}
          AND NOT EXISTS (
              SELECT 1 FROM reservas r2
              WHERE r2.email = r.email
                AND r2.fecha < :desde_sub
          )
    ");
    $stmt->execute($params_nuevos);
    $clientes_nuevos      = (int) $stmt->fetchColumn();
    $clientes_recurrentes = $clientes_unicos - $clientes_nuevos;


    // --- 4. Ocupación de hoy (independiente del filtro de fechas) ---
    $hoy = date('Y-m-d');

    // Reservas activas hoy: pendientes o confirmadas
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM reservas
        WHERE fecha = :hoy
          AND estado IN ('pendiente', 'confirmada')
    ");
    $stmt->execute([':hoy' => $hoy]);
    $reservas_hoy_activas = (int) $stmt->fetchColumn();

    // Capacidad total de hoy: suma de todos los slots activos (40 por defecto si no hay fila en aforo)
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(COALESCE(a.capacidad_total, 40)), 0) AS cap_total
        FROM horarios h
        LEFT JOIN aforo a ON a.fecha = :hoy AND a.hora = h.hora_inicio
        WHERE h.activo = 1
    ");
    $stmt->execute([':hoy' => $hoy]);
    $cap_total_hoy = (int) $stmt->fetchColumn();

    // Capacidad ocupada hoy: suma de bloques de reservas no canceladas
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(br.capacidad_asignada), 0) AS ocupado
        FROM bloques_reserva br
        JOIN reservas r ON br.id_reserva = r.id_reserva
        WHERE br.fecha = :hoy
          AND r.estado IN ('pendiente', 'confirmada')
    ");
    $stmt->execute([':hoy' => $hoy]);
    $cap_ocupada_hoy = (int) $stmt->fetchColumn();

    $ratio_ocupacion = $cap_total_hoy > 0
        ? round(($cap_ocupada_hoy / $cap_total_hoy) * 100, 1)
        : 0;


    echo json_encode([
        'success' => true,
        'data'    => [
            'reservas' => [
                'total'            => $total,
                'confirmadas'      => $confirmadas,
                'pendientes'       => $pendientes,
                'canceladas'       => $canceladas,
                'tasa_cancelacion' => $tasa_cancelacion,
            ],
            'clientes' => [
                'unicos'      => $clientes_unicos,
                'nuevos'      => $clientes_nuevos,
                'recurrentes' => $clientes_recurrentes,
            ],
            'ocupacion' => [
                'reservas_hoy_activas' => $reservas_hoy_activas,
                'cap_total_hoy'        => $cap_total_hoy,
                'cap_ocupada_hoy'      => $cap_ocupada_hoy,
                'ratio_ocupacion'      => $ratio_ocupacion,
            ],
        ],
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
