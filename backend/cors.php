<?php
// cors.php - Se incluye automáticamente antes de cada endpoint via auto_prepend_file
// Gestiona CORS y cookies de sesión cross-origin

$origin = 'https://proyecto-fin-de-grado-9h1y.vercel.app';

header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Responder al preflight OPTIONS sin ejecutar nada más
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Configurar cookie de sesión para cross-origin (SameSite=None requiere Secure=true)
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'None'
]);
