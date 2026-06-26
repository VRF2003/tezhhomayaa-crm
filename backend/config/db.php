<?php
// backend/config/db.php
require_once __DIR__ . '/../helpers/cors.php';
setCorsHeaders();

$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_DATABASE') ?: 'u543643154_tezhhomayaaerp';
$user = getenv('DB_USERNAME') ?: 'u543643154_erp_admin';
$pass = getenv('DB_PASSWORD') ?: 'Victory@2003$#';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     sendJsonResponse(["error" => "Database connection failed"], 500);
}
