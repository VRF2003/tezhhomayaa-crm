<?php
// backend/import_to_mysql.php
require_once __DIR__ . '/config/db.php';

echo "<h1>Starting Migration...</h1>";

$backupFile = __DIR__ . '/backup.json';
if (!file_exists($backupFile)) {
    die("Error: Please upload your exported JSON backup file and rename it to exactly 'backup.json' in the backend folder.");
}

$json = file_get_contents($backupFile);
$data = json_decode($json, true);

if (!$data) {
    die("Error: Invalid JSON file.");
}

try {
    $pdo->beginTransaction();

    // 1. Import Buyers
    if (!empty($data['buyers'])) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO buyers (id, name, company, country, phone, email, whatsapp, buyer_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($data['buyers'] as $b) {
            $stmt->execute([
                $b['id'] ?? null, $b['name'] ?? '', $b['company'] ?? '', $b['country'] ?? '',
                $b['phone'] ?? '', $b['email'] ?? '', $b['whatsapp'] ?? '', $b['buyerType'] ?? ''
            ]);
        }
        echo "<p>✅ Imported " . count($data['buyers']) . " Buyers.</p>";
    }

    // 2. Import Products
    if (!empty($data['products'])) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO products (id, style_code, product_name, category, design, colour, tier, image_url, base_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($data['products'] as $p) {
            $stmt->execute([
                $p['id'] ?? null, $p['styleCode'] ?? '', $p['productName'] ?? '', $p['category'] ?? '',
                $p['design'] ?? '', $p['colour'] ?? '', $p['tier'] ?? '', $p['image'] ?? '', $p['baseCost'] ?? 0
            ]);
        }
        echo "<p>✅ Imported " . count($data['products']) . " Products.</p>";
    }

    // 3. Import Quotes & Orders
    if (!empty($data['quotes'])) {
        $stmtQuote = $pdo->prepare("INSERT IGNORE INTO quotes (id, quote_number, buyer_id, date, status, total_value, payment_terms, shipping_terms, production_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmtItem = $pdo->prepare("INSERT IGNORE INTO quote_items (quote_id, product_id, qty, unit_price, line_total, size_breakdown) VALUES (?, ?, ?, ?, ?, ?)");
        
        foreach ($data['quotes'] as $q) {
            $buyer_id = $q['buyerId'] ?? 1; // Default to 1 if missing
            $stmtQuote->execute([
                $q['id'] ?? null, $q['quoteNumber'] ?? '', $buyer_id, $q['date'] ?? date('Y-m-d'), 
                $q['status'] ?? 'Draft', $q['totalValue'] ?? 0, $q['paymentTerms'] ?? '', 
                $q['shippingTerms'] ?? '', $q['production'] ? ($q['production']['productionStatus'] ?? 'Waiting') : 'Waiting'
            ]);
            
            if (!empty($q['items'])) {
                foreach ($q['items'] as $item) {
                    $stmtItem->execute([
                        $q['id'], $item['productId'] ?? 1, $item['qty'] ?? 0, 
                        $item['unitPrice'] ?? 0, $item['lineTotal'] ?? 0, json_encode($item['sizes'] ?? [])
                    ]);
                }
            }
        }
        echo "<p>✅ Imported " . count($data['quotes']) . " Quotes/Orders.</p>";
    }

    $pdo->commit();
    echo "<h2 style='color:green;'>Migration 100% Successful!</h2>";
    echo "<p>You can now safely delete the backup.json and import_to_mysql.php files from Hostinger.</p>";

} catch (Exception $e) {
    $pdo->rollBack();
    echo "<h2 style='color:red;'>Migration Failed!</h2>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
