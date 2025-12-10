<?php
// Database configuration
$host = 'localhost';
$db_name = 'overbus';
$username = 'root'; // Default XAMPP username
$password = '';     // Default XAMPP password (usually empty)

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    // Set PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Connection failed: " . $e->getMessage()]);
    exit;
}

// Start Session for all API calls
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Helper function for JSON response
function sendJson($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
?>