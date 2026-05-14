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

// Parámetros
$fecha_desde = $_GET['fecha_desde'] ?? date('Y-m-01');
$fecha_hasta = $_GET['fecha_hasta'] ?? date('Y-m-t');
$estado      = $_GET['estado']      ?? '';
$pagina      = max(1, (int) ($_GET['pagina']      ?? 1));
$orden_campo = $_GET['orden_campo'] ?? 'fecha';
$orden_dir   = strtoupper($_GET['orden_dir'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';

// Validar fechas
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha_desde) ||
    !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha_hasta)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Fechas no válidas']);
    exit;
}

// Whitelist de campos para ordenación: previene inyección SQL al interpolar en la query
$campos_permitidos = ['fecha', 'estado', 'nombre', 'num_personas'];
if (!in_array($orden_campo, $campos_permitidos)) {
    $orden_campo = 'fecha';
}

$estados_validos = ['', 'pendiente', 'confirmada', 'cancelada'];
if (!in_array($estado, $estados_validos)) {
    $estado = '';
}

$por_pagina = 20;
$offset     = ($pagina - 1) * $por_pagina;

// Condición de estado condicional para no reusar parámetros PDO
$where_estado = $estado !== '' ? " AND r.estado = :estado" : '';

$params_base = [':desde' => $fecha_desde, ':hasta' => $fecha_hasta];
if ($estado !== '') {
    $params_base[':estado'] = $estado;
}

try {

    // Total de filas para calcular la paginación
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM reservas r
        WHERE r.fecha BETWEEN :desde AND :hasta
        {$where_estado}
    ");
    $stmt->execute($params_base);
    $total_filas   = (int) $stmt->fetchColumn();
    $total_paginas = $total_filas > 0 ? (int) ceil($total_filas / $por_pagina) : 1;

    // Reservas del periodo con flag de cliente nuevo/recurrente.
    // El campo orden y dirección vienen de una whitelist, por lo que la interpolación es segura.
    $params_tabla = array_merge($params_base, [
        ':desde_sub'  => $fecha_desde,
        ':offset'     => $offset,
        ':por_pagina' => $por_pagina,
    ]);

    // $offset y $por_pagina son enteros calculados en PHP (no vienen del usuario),
    // se interpolan directamente para evitar el bug de PDO con LIMIT y parámetros nombrados.
    $params_tabla = array_merge($params_base, [':desde_sub' => $fecha_desde]);

    $stmt = $pdo->prepare("
        SELECT
            r.id_reserva,
            r.nombre,
            r.apellidos,
            r.fecha,
            r.hora_inicio,
            r.num_personas,
            r.estado,
            CASE WHEN EXISTS (
                SELECT 1 FROM reservas r2
                WHERE r2.email = r.email
                  AND r2.fecha < :desde_sub
            ) THEN 0 ELSE 1 END AS es_nuevo
        FROM reservas r
        WHERE r.fecha BETWEEN :desde AND :hasta
        {$where_estado}
        ORDER BY r.{$orden_campo} {$orden_dir}
        LIMIT {$offset}, {$por_pagina}
    ");
    $stmt->execute($params_tabla);

    $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Normalizar tipos
    foreach ($reservas as &$r) {
        $r['id_reserva']   = (int)  $r['id_reserva'];
        $r['num_personas'] = (int)  $r['num_personas'];
        $r['es_nuevo']     = (bool) $r['es_nuevo'];
        $r['hora_inicio']  = substr($r['hora_inicio'], 0, 5);
    }
    unset($r);

    echo json_encode([
        'success' => true,
        'data'    => [
            'reservas'      => $reservas,
            'pagina_actual' => $pagina,
            'total_paginas' => $total_paginas,
            'total_filas'   => $total_filas,
        ],
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
