<?php
header('Content-Type: application/json');
session_start();

// destruyo la sesión completamente
session_destroy();

echo json_encode(['success' => true, 'message' => 'Sesión cerrada']);
