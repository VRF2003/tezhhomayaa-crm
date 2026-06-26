<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/auth_middleware.php';
requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'pdf_settings'");
    $result = $stmt->fetch();
    sendJsonResponse($result ? json_decode($result['setting_value'], true) : null);
} elseif ($method === 'PUT') {
    $data = getJsonInput();
    $json = json_encode($data);
    $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('pdf_settings', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->execute([$json, $json]);
    sendJsonResponse($data);
}
