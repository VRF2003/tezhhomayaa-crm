<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/auth_middleware.php';
requireAuth();
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
