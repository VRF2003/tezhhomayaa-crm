<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/auth_middleware.php';
requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM buyers WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        sendJsonResponse($stmt->fetch() ?: null);
    } else if (isset($_GET['name'])) {
        $stmt = $pdo->prepare("SELECT * FROM buyers WHERE name = ?");
        $stmt->execute([$_GET['name']]);
        sendJsonResponse($stmt->fetchAll());
    } else {
        $stmt = $pdo->query("SELECT * FROM buyers ORDER BY id DESC");
        sendJsonResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getJsonInput();
    $stmt = $pdo->prepare("INSERT INTO buyers (name, company, country, phone, email, whatsapp, buyer_type) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['name'] ?? '', $data['company'] ?? '', $data['country'] ?? '',
        $data['phone'] ?? '', $data['email'] ?? '', $data['whatsapp'] ?? '', $data['buyerType'] ?? ''
    ]);
    $data['id'] = $pdo->lastInsertId();
    sendJsonResponse($data);
} elseif ($method === 'PUT') {
    $data = getJsonInput();
    $stmt = $pdo->prepare("UPDATE buyers SET name=?, company=?, country=?, phone=?, email=?, whatsapp=?, buyer_type=? WHERE id=?");
    $stmt->execute([
        $data['name'] ?? '', $data['company'] ?? '', $data['country'] ?? '',
        $data['phone'] ?? '', $data['email'] ?? '', $data['whatsapp'] ?? '', $data['buyerType'] ?? '',
        $data['id']
    ]);
    sendJsonResponse($data);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM buyers WHERE id = ?");
        $stmt->execute([$id]);
        sendJsonResponse(["success" => true]);
    }
}
