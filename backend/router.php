<?php
// router.php - Punto de entrada único para Railway (php -S ... router.php)
// Gestiona CORS, cookies de sesión cross-origin y enruta al endpoint correcto

$origin = 'https://proyectofindegrado.vercel.app'; // ← actualizar con la URL real de Vercel tras el despliegue

header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Responder al preflight OPTIONS sin ejecutar nada más
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Configurar cookie de sesión para que funcione cross-origin (SameSite=None requiere Secure=true)
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'None'
]);

// Resolver la ruta del archivo solicitado
$uri  = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$file = __DIR__ . $uri;

// Servir archivos estáticos directamente (imágenes, etc.)
if (is_file($file) && !str_ends_with($file, '.php')) {
    return false;
}

// Ejecutar el endpoint PHP correspondiente
if (is_file($file) && str_ends_with($file, '.php')) {
    require $file;
    exit;
}

// 404 en formato JSON para que el frontend lo entienda
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
