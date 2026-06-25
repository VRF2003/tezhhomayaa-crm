<?php
require_once __DIR__ . '/../config/db.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        sendJsonResponse($stmt->fetch() ?: null);
    } else if (isset($_GET['styleCode'])) {
        $stmt = $pdo->prepare("SELECT * FROM products WHERE style_code = ?");
        $stmt->execute([$_GET['styleCode']]);
        sendJsonResponse($stmt->fetchAll());
    } else {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY id DESC");
        sendJsonResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getJsonInput();
    $stmt = $pdo->prepare("INSERT INTO products (style_code, product_name, category, design, colour, tier, image_url, base_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['styleCode'] ?? '', $data['productName'] ?? '', $data['category'] ?? '',
        $data['design'] ?? '', $data['colour'] ?? '', $data['tier'] ?? '', $data['image'] ?? '', $data['baseCost'] ?? 0
    ]);
    $data['id'] = $pdo->lastInsertId();
    sendJsonResponse($data);
} elseif ($method === 'PUT') {
    $data = getJsonInput();
    $stmt = $pdo->prepare("UPDATE products SET style_code=?, product_name=?, category=?, design=?, colour=?, tier=?, image_url=?, base_cost=? WHERE id=?");
    $stmt->execute([
        $data['styleCode'] ?? '', $data['productName'] ?? '', $data['category'] ?? '',
        $data['design'] ?? '', $data['colour'] ?? '', $data['tier'] ?? '', $data['image'] ?? '', $data['baseCost'] ?? 0,
        $data['id']
    ]);
    sendJsonResponse($data);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        sendJsonResponse(["success" => true]);
    }
}
