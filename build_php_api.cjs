const fs = require('fs');
const path = require('path');

const corsHelper = `<?php
function setCorsHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
function getJsonInput() {
    return json_decode(file_get_contents('php://input'), true);
}
function sendJsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}
`;
fs.writeFileSync(path.join(__dirname, 'backend/helpers/cors.php'), corsHelper);

const dbConfig = `<?php
// backend/config/db.php
require_once __DIR__ . '/../helpers/cors.php';
setCorsHeaders();

$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_DATABASE') ?: 'tezhhomayaa_erp';
$user = getenv('DB_USERNAME') ?: 'root';
$pass = getenv('DB_PASSWORD') ?: '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\\PDOException $e) {
     sendJsonResponse(["error" => "Database connection failed"], 500);
}
`;
fs.writeFileSync(path.join(__dirname, 'backend/config/db.php'), dbConfig);

const buyersApi = `<?php
require_once __DIR__ . '/../config/db.php';
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
`;
fs.writeFileSync(path.join(__dirname, 'backend/api/buyers.php'), buyersApi);

const productsApi = `<?php
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
`;
fs.writeFileSync(path.join(__dirname, 'backend/api/products.php'), productsApi);

const settingsApi = `<?php
require_once __DIR__ . '/../config/db.php';
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
`;
fs.writeFileSync(path.join(__dirname, 'backend/api/settings.php'), settingsApi);

const quotesApi = `<?php
require_once __DIR__ . '/../config/db.php';
$method = $_SERVER['REQUEST_METHOD'];

// Quotes API requires handling quote_items relation, but to perfectly match IndexedDB structure for the MVP migration, 
// we will store the whole quote object including items as JSON for now, or just implement the complex relation.
// For perfect compatibility with current db_quotes, we can just store the raw JSON in a "data" column, 
// OR properly map it. Since we created proper SQL schema (quotes + quote_items), let's properly map it.

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM quotes WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        $quote = $stmt->fetch();
        if ($quote) {
            $stmt = $pdo->prepare("SELECT * FROM quote_items WHERE quote_id = ?");
            $stmt->execute([$quote['id']]);
            $quote['items'] = $stmt->fetchAll();
        }
        sendJsonResponse($quote ?: null);
    } else {
        // Return all quotes with their items
        $stmt = $pdo->query("SELECT * FROM quotes ORDER BY id DESC");
        $quotes = $stmt->fetchAll();
        foreach ($quotes as &$quote) {
            $stmt = $pdo->prepare("SELECT * FROM quote_items WHERE quote_id = ?");
            $stmt->execute([$quote['id']]);
            $quote['items'] = $stmt->fetchAll();
        }
        sendJsonResponse($quotes);
    }
} elseif ($method === 'POST') {
    $data = getJsonInput();
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO quotes (quote_number, buyer_id, date, status, total_value, payment_terms, shipping_terms) VALUES (?, ?, ?, ?, ?, ?, ?)");
        // Dummy buyer_id logic for now if frontend doesn't pass it cleanly
        $buyer_id = $data['buyerId'] ?? 1; 
        $stmt->execute([
            $data['quoteNumber'] ?? '', $buyer_id, $data['date'] ?? date('Y-m-d'), $data['status'] ?? 'Draft',
            $data['totalValue'] ?? 0, $data['paymentTerms'] ?? '', $data['shippingTerms'] ?? ''
        ]);
        $quote_id = $pdo->lastInsertId();
        $data['id'] = $quote_id;

        if (isset($data['items']) && is_array($data['items'])) {
            $stmtItem = $pdo->prepare("INSERT INTO quote_items (quote_id, product_id, qty, unit_price, line_total, size_breakdown) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($data['items'] as $item) {
                $stmtItem->execute([
                    $quote_id, $item['productId'] ?? 1, $item['qty'] ?? 0, $item['unitPrice'] ?? 0, $item['lineTotal'] ?? 0, json_encode($item['sizes'] ?? [])
                ]);
            }
        }
        $pdo->commit();
        sendJsonResponse($data);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendJsonResponse(["error" => $e->getMessage()], 500);
    }
} elseif ($method === 'PUT') {
    $data = getJsonInput();
    $quote_id = $data['id'];
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("UPDATE quotes SET quote_number=?, status=?, total_value=?, payment_terms=?, shipping_terms=?, production_status=?, expected_start_date=?, expected_finish_date=? WHERE id=?");
        $stmt->execute([
            $data['quoteNumber'] ?? '', $data['status'] ?? 'Draft', $data['totalValue'] ?? 0, 
            $data['paymentTerms'] ?? '', $data['shippingTerms'] ?? '',
            $data['production_status'] ?? 'Waiting', $data['expected_start_date'] ?? null, $data['expected_finish_date'] ?? null,
            $quote_id
        ]);
        
        // Overwrite items
        $pdo->prepare("DELETE FROM quote_items WHERE quote_id=?")->execute([$quote_id]);
        if (isset($data['items']) && is_array($data['items'])) {
            $stmtItem = $pdo->prepare("INSERT INTO quote_items (quote_id, product_id, qty, unit_price, line_total, size_breakdown) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($data['items'] as $item) {
                $stmtItem->execute([
                    $quote_id, $item['productId'] ?? 1, $item['qty'] ?? 0, $item['unitPrice'] ?? 0, $item['lineTotal'] ?? 0, json_encode($item['sizes'] ?? [])
                ]);
            }
        }
        $pdo->commit();
        sendJsonResponse($data);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendJsonResponse(["error" => $e->getMessage()], 500);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM quotes WHERE id = ?");
        $stmt->execute([$id]); // CASCADE will handle items
        sendJsonResponse(["success" => true]);
    }
}
`;
fs.writeFileSync(path.join(__dirname, 'backend/api/quotes.php'), quotesApi);

console.log("PHP APIs generated successfully.");
