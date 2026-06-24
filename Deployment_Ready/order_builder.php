<?php
// order_builder.php (Headless API Endpoint)

// Production Security Settings
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *"); // Configure to your frontend domain in production
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'auth.php'; // Includes db.php automatically

$request_method = $_SERVER['REQUEST_METHOD'];
$resource = isset($_GET['resource']) ? $_GET['resource'] : '';
$id = isset($_GET['id']) ? $_GET['id'] : null;

// Require valid JWT session for all requests
$user = require_auth();
$action = ($request_method === 'GET') ? 'view' : 'edit';

// Check permissions based on resource
if ($resource === 'products') {
    require_permission($pdo, $user['user_id'], 'products', $action);
} elseif ($resource === 'quotes' || $resource === 'buyers') {
    // Both use the same logical perm for quotes, but let's separate them if buyers are tracked separately.
    // We didn't map a buyers API endpoint specifically yet, handleQuotes does quotes.
    require_permission($pdo, $user['user_id'], 'quotes', $action);
} elseif ($resource === 'settings') {
    require_permission($pdo, $user['user_id'], 'settings', $action);
}

// Handle JSON input
$input_data = json_decode(file_get_contents('php://input'), true);

switch ($resource) {
    case 'products':
        handleProducts($pdo, $request_method, $id, $input_data);
        break;
    case 'quotes':
        handleQuotes($pdo, $request_method, $id, $input_data);
        break;
    case 'settings':
        handleSettings($pdo, $request_method, $id, $input_data);
        break;
    default:
        http_response_code(404);
        echo json_encode(["error" => "Resource not found"]);
        break;
}

// --- Resource Handlers ---

function handleProducts($pdo, $method, $id, $data) {
    if ($method == 'GET') {
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE styleCode = ?");
            $stmt->execute([$id]);
            $result = $stmt->fetchAll();
            echo json_encode($result);
        } else {
            $stmt = $pdo->query("SELECT * FROM products ORDER BY id DESC");
            $products = $stmt->fetchAll();
            // Convert numeric types
            foreach ($products as &$p) {
                $p['cost'] = (float)$p['cost'];
                $p['finalCost'] = (float)$p['finalCost'];
                $p['retailPrice'] = (float)$p['retailPrice'];
                $p['wholesale50'] = (float)$p['wholesale50'];
                $p['wholesale40'] = (float)$p['wholesale40'];
                $p['wholesale30'] = (float)$p['wholesale30'];
                if ($p['overrideMoq'] !== null) $p['overrideMoq'] = (int)$p['overrideMoq'];
            }
            echo json_encode($products);
        }
    } elseif ($method == 'POST' || $method == 'PUT') {
        $stmt = $pdo->prepare("
            INSERT INTO products (productName, category, silhouette, overrideMoq, design, colour, styleCode, fabric, cost, finalCost, retailPrice, wholesale50, wholesale40, wholesale30, status, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            productName=VALUES(productName), category=VALUES(category), silhouette=VALUES(silhouette), overrideMoq=VALUES(overrideMoq), design=VALUES(design), colour=VALUES(colour), fabric=VALUES(fabric), cost=VALUES(cost), finalCost=VALUES(finalCost), retailPrice=VALUES(retailPrice), wholesale50=VALUES(wholesale50), wholesale40=VALUES(wholesale40), wholesale30=VALUES(wholesale30), status=VALUES(status), image=VALUES(image)
        ");
        
        $stmt->execute([
            $data['productName'] ?? '',
            $data['category'] ?? '',
            $data['silhouette'] ?? 'Uncategorized',
            $data['overrideMoq'] ?? null,
            $data['design'] ?? '',
            $data['colour'] ?? '',
            $data['styleCode'] ?? '',
            $data['fabric'] ?? '',
            $data['cost'] ?? 0,
            $data['finalCost'] ?? 0,
            $data['retailPrice'] ?? 0,
            $data['wholesale50'] ?? 0,
            $data['wholesale40'] ?? 0,
            $data['wholesale30'] ?? 0,
            $data['status'] ?? 'Active',
            $data['image'] ?? null
        ]);
        
        global $user;
        if (isset($user)) {
            log_audit_action($pdo, $user['user_id'], 'save_product', 'products', $data['styleCode'] ?? '', ['name' => $data['productName'] ?? '']);
        }
        
        echo json_encode(["message" => "Product saved successfully"]);
    } elseif ($method == 'DELETE') {
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM products WHERE styleCode = ?");
            $stmt->execute([$id]);
            echo json_encode(["message" => "Product deleted"]);
        } else {
            // Delete all except CSV base products if necessary, or just truncate
            $pdo->query("TRUNCATE TABLE products");
            echo json_encode(["message" => "All products deleted"]);
        }
    }
}

function handleQuotes($pdo, $method, $id, $data) {
    if ($method == 'GET') {
        if ($id) {
            // Get single quote
            $stmt = $pdo->prepare("SELECT * FROM quotes WHERE id = ?");
            $stmt->execute([$id]);
            $quote = $stmt->fetch();
            if ($quote) {
                $stmt_items = $pdo->prepare("SELECT * FROM quote_items WHERE quote_id = ?");
                $stmt_items->execute([$id]);
                $items = $stmt_items->fetchAll();
                foreach($items as &$item) {
                    $item['sizes'] = json_decode($item['sizes'], true);
                    // Reconstruct product object for frontend
                    $item['product'] = [
                        'productName' => $item['productName'],
                        'styleCode' => $item['styleCode'],
                        'design' => $item['design'],
                        'colour' => $item['colour'],
                        'category' => $item['category'],
                        'silhouette' => $item['silhouette'],
                        'overrideMoq' => $item['overrideMoq']
                    ];
                }
                $quote['items'] = $items;
                echo json_encode($quote);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Quote not found"]);
            }
        } else {
            // Get all quotes
            $stmt = $pdo->query("SELECT * FROM quotes ORDER BY timestamp DESC");
            $quotes = $stmt->fetchAll();
            echo json_encode($quotes);
        }
    } elseif ($method == 'POST' || $method == 'PUT') {
        try {
            $pdo->beginTransaction();
            
            // Insert/Update Quote
            $stmt = $pdo->prepare("
                INSERT INTO quotes (id, buyerName, company, country, mobile, email, whatsapp, buyerType, status, itemCount, totalCost, totalValue)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                buyerName=VALUES(buyerName), company=VALUES(company), country=VALUES(country), mobile=VALUES(mobile), email=VALUES(email), whatsapp=VALUES(whatsapp), buyerType=VALUES(buyerType), status=VALUES(status), itemCount=VALUES(itemCount), totalCost=VALUES(totalCost), totalValue=VALUES(totalValue)
            ");
            
            $stmt->execute([
                $data['id'],
                $data['buyerName'] ?? '',
                $data['company'] ?? '',
                $data['country'] ?? '',
                $data['mobile'] ?? '',
                $data['email'] ?? '',
                $data['whatsapp'] ?? '',
                $data['buyerType'] ?? '',
                $data['status'] ?? 'Draft',
                $data['itemCount'] ?? 0,
                $data['totalCost'] ?? 0,
                $data['totalValue'] ?? 0
            ]);

            // Clear old items
            $stmt_del = $pdo->prepare("DELETE FROM quote_items WHERE quote_id = ?");
            $stmt_del->execute([$data['id']]);

            // Insert new items
            if (!empty($data['items'])) {
                $stmt_item = $pdo->prepare("
                    INSERT INTO quote_items (quote_id, styleCode, productName, design, colour, category, silhouette, overrideMoq, tier, unitPrice, sizes, qty, total, image)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                foreach ($data['items'] as $item) {
                    $prod = $item['product'] ?? [];
                    $stmt_item->execute([
                        $data['id'],
                        $prod['styleCode'] ?? '',
                        $prod['productName'] ?? '',
                        $prod['design'] ?? '',
                        $prod['colour'] ?? '',
                        $prod['category'] ?? '',
                        $prod['silhouette'] ?? 'Uncategorized',
                        $prod['overrideMoq'] ?? null,
                        $item['tier'] ?? '',
                        $item['unitPrice'] ?? 0,
                        json_encode($item['sizes'] ?? []),
                        $item['qty'] ?? 0,
                        $item['total'] ?? 0,
                        $item['image'] ?? null
                    ]);
                }
            }

            $pdo->commit();
            echo json_encode(["message" => "Quote saved successfully"]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Failed to save quote", "details" => $e->getMessage()]);
        }
    } elseif ($method == 'DELETE') {
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM quotes WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["message" => "Quote deleted"]);
        }
    }
}

function handleSettings($pdo, $method, $id, $data) {
    if ($method == 'GET') {
        $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'pdfSettings'");
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row) {
            echo $row['setting_value']; // Already JSON string
        } else {
            echo json_encode([]);
        }
    } elseif ($method == 'PUT' || $method == 'POST') {
        $stmt = $pdo->prepare("
            INSERT INTO settings (setting_key, setting_value)
            VALUES ('pdfSettings', ?)
            ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)
        ");
        $stmt->execute([json_encode($data)]);
        echo json_encode(["message" => "Settings saved successfully"]);
    }
}
?>
