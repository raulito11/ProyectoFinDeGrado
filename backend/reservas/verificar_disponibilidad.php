<?php
// ============================================================
// verificar_disponibilidad.php
// Comprueba si hay aforo para una fecha, hora y nº de personas.
// La función verificar_disponibilidad_interna() también la usa
// crear_reserva.php cuando incluye este archivo.
// ============================================================

/**
 * Comprueba si hay aforo disponible para los 4 bloques de 30 min
 * que ocupa una reserva de 2 horas.
 *
 * @param PDO    $pdo
 * @param string $fecha              Fecha (YYYY-MM-DD)
 * @param string $hora_inicio        Hora de inicio (HH:MM:SS)
 * @param int    $capacidad_asignada CEIL(num_personas / 2) * 2
 *
 * @return array ['disponible' => true]
 *            o  ['disponible' => false, 'motivo' => string]
 */
function verificar_disponibilidad_interna($pdo, $fecha, $hora_inicio, $capacidad_asignada) {

    // --- 1. ¿Está el día cerrado? ---
    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS total
        FROM cierres
        WHERE fecha = :fecha
    ");
    $stmt->execute([':fecha' => $fecha]);
    $cierre = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($cierre['total'] > 0) {
        return ['disponible' => false, 'motivo' => 'El restaurante está cerrado ese día'];
    }

    // --- 2. ¿Existe la hora y está activa? ---
    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS total
        FROM horarios
        WHERE hora_inicio = :hora_inicio
          AND activo = 1
    ");
    $stmt->execute([':hora_inicio' => $hora_inicio]);
    $horario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($horario['total'] === 0) {
        return ['disponible' => false, 'motivo' => 'La hora seleccionada no está disponible'];
    }

    // --- 3. Compruebo el aforo en cada uno de los 4 bloques ---
    // Una reserva dura 2 horas → ocupa 4 slots de 30 min
    $base = strtotime($hora_inicio);

    for ($i = 0; $i < 4; $i++) {
        $hora_bloque = date('H:i:s', $base + ($i * 30 * 60));

        // capacidad ya ocupada en este slot (solo reservas activas)
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(br.capacidad_asignada), 0) AS ocupado
            FROM bloques_reserva br
            INNER JOIN reservas r ON r.id_reserva = br.id_reserva
            WHERE br.fecha       = :fecha
              AND br.hora_inicio = :hora_bloque
              AND r.estado IN ('pendiente', 'confirmada')
        ");
        $stmt->execute([':fecha' => $fecha, ':hora_bloque' => $hora_bloque]);
        $suma_ocupada = (int) $stmt->fetch(PDO::FETCH_ASSOC)['ocupado'];

        // aforo total para ese slot (40 por defecto si no hay fila en la tabla)
        $stmt = $pdo->prepare("
            SELECT capacidad_total
            FROM aforo
            WHERE fecha = :fecha
              AND hora  = :hora_bloque
            LIMIT 1
        ");
        $stmt->execute([':fecha' => $fecha, ':hora_bloque' => $hora_bloque]);
        $aforo = $stmt->fetch(PDO::FETCH_ASSOC);

        $capacidad_total = ($aforo !== false) ? (int) $aforo['capacidad_total'] : 40;

        if (($suma_ocupada + $capacidad_asignada) > $capacidad_total) {
            return ['disponible' => false, 'motivo' => 'No hay aforo suficiente para esa fecha y hora'];
        }
    }

    return ['disponible' => true];
}


// ============================================================
// ENDPOINT — solo se ejecuta si se llama a este archivo directamente,
// no cuando crear_reserva.php lo incluye para usar la función.
// ============================================================
if (!defined('INCLUIDO_COMO_FUNCION')) {

    header('Content-Type: application/json');
    session_start();

    require_once __DIR__ . '/../config/db.php';

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        exit;
    }

    $datos = json_decode(file_get_contents('php://input'), true);

    if (empty($datos['fecha']) || empty($datos['hora_inicio']) || !isset($datos['num_personas'])) {
        echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios']);
        exit;
    }

    $fecha        = $datos['fecha'];
    $hora_inicio  = $datos['hora_inicio'];
    $num_personas = (int) $datos['num_personas'];

    if ($num_personas <= 0) {
        echo json_encode(['success' => false, 'message' => 'El número de personas debe ser mayor que 0']);
        exit;
    }

    $capacidad_asignada = (int) ceil($num_personas / 2) * 2;

    try {
        $resultado = verificar_disponibilidad_interna($pdo, $fecha, $hora_inicio, $capacidad_asignada);
        echo json_encode($resultado);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
    }
}
