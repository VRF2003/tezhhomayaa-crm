<?php
// backend/config.php
$db_host = 'localhost';
$db_name = 'tezhhomayaa_crm';
$db_user = 'root';
$db_pass = ''; // Set your database password here

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die(json_encode([
        'error' => 'Database connection failed',
        'message' => $e->getMessage()
    ]));
}
?>
