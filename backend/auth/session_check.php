<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

session_start();

// compruebo si hay una sesión activa mirando si existe el id de usuario
if (empty($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
    exit;
}

// devuelvo los datos del usuario que hay en sesión
echo json_encode([
    'success' => true,
    'data'    => [
        'id'     => $_SESSION['id'],
        'nombre' => $_SESSION['nombre'],
        'email'  => $_SESSION['email'],
        'rol'    => $_SESSION['rol']
    ]
]);
