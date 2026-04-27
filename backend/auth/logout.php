<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

session_start();

// destruyo la sesión completamente
session_destroy();

echo json_encode(['success' => true, 'message' => 'Sesión cerrada']);
