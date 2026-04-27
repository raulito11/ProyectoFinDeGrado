<?php
// datos de conexión a la base de datos
$db_host     = 'localhost';
$db_usuario  = 'root';
$db_password = '';
$db_nombre   = 'restaurante_tfg';

// creo la conexión con PDO
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_nombre", $db_usuario, $db_password);
    // que PDO lance excepciones si hay algún error en las queries
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Error al conectar con la base de datos: ' . $e->getMessage()
    ]);
    exit;
}
