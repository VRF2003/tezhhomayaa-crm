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
    $pdo->exec("SET FOREIGN_KEY_CHECKS=0;");
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
        $pdo->exec("DROP TABLE IF EXISTS products");
        $pdo->exec("CREATE TABLE products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            style_code VARCHAR(100) UNIQUE NOT NULL,
            product_name VARCHAR(150) NOT NULL,
            category VARCHAR(50),
            silhouette VARCHAR(100),
            override_moq INT,
            lead_time INT,
            design VARCHAR(100),
            colour VARCHAR(100),
            tier VARCHAR(50),
            fabric VARCHAR(100),
            cost DECIMAL(10,2) DEFAULT 0.00,
            final_cost DECIMAL(10,2) DEFAULT 0.00,
            retail_price DECIMAL(10,2) DEFAULT 0.00,
            wholesale50 DECIMAL(10,2) DEFAULT 0.00,
            wholesale40 DECIMAL(10,2) DEFAULT 0.00,
            wholesale30 DECIMAL(10,2) DEFAULT 0.00,
            status VARCHAR(50) DEFAULT 'Active',
            image_url TEXT,
            base_cost DECIMAL(10,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");

        $stmt = $pdo->prepare("INSERT IGNORE INTO products (id, style_code, product_name, category, silhouette, override_moq, lead_time, design, colour, tier, fabric, cost, final_cost, retail_price, wholesale50, wholesale40, wholesale30, status, image_url, base_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($data['products'] as $p) {
            $stmt->execute([
                $p['id'] ?? null, $p['styleCode'] ?? '', $p['productName'] ?? '', $p['category'] ?? '',
                $p['silhouette'] ?? null, $p['overrideMoq'] ?? null, $p['leadTime'] ?? null,
                $p['design'] ?? '', $p['colour'] ?? '', $p['tier'] ?? '', $p['fabric'] ?? '',
                $p['cost'] ?? 0, $p['finalCost'] ?? 0, $p['retailPrice'] ?? 0,
                $p['wholesale50'] ?? 0, $p['wholesale40'] ?? 0, $p['wholesale30'] ?? 0,
                $p['status'] ?? 'Active', $p['image'] ?? '', $p['baseCost'] ?? 0
            ]);
        }
        echo "<p>✅ Imported " . count($data['products']) . " Products with full pricing details.</p>";
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
    $pdo->exec("SET FOREIGN_KEY_CHECKS=1;");
    echo "<h2 style='color:green;'>Migration 100% Successful!</h2>";
    echo "<p>You can now safely delete the backup.json and import_to_mysql.php files from Hostinger.</p>";

} catch (Exception $e) {
    $pdo->rollBack();
    echo "<h2 style='color:red;'>Migration Failed!</h2>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
