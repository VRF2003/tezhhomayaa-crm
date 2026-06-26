<?php
// backend/helpers/auth_middleware.php
require_once __DIR__ . '/../config/db.php';

function requireAuth() {
    global $pdo;
    
    // In PHP, apache_request_headers() or $_SERVER can be used.
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    // Bypass for CORS preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        return true;
    }
    
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        
        $stmt = $pdo->prepare("SELECT id, token_expires_at FROM users WHERE token = ?");
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        if ($user && strtotime($user['token_expires_at']) > time()) {
            return $user['id']; // Authenticated
        }
    }
    
    // If not authenticated, return 401 Unauthorized and exit
    header('HTTP/1.1 401 Unauthorized');
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(["error" => "Unauthorized access. Please log in."]);
    exit;
}
?>
