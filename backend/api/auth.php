<?php
// backend/api/auth.php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = getJsonInput();
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        sendJsonResponse(["error" => "Username and password are required"], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Generate secure token
        $token = bin2hex(random_bytes(32));
        // Set expiration to 24 hours from now
        $expires = date('Y-m-d H:i:s', time() + 86400);

        $updateStmt = $pdo->prepare("UPDATE users SET token = ?, token_expires_at = ? WHERE id = ?");
        $updateStmt->execute([$token, $expires, $user['id']]);

        sendJsonResponse([
            "success" => true,
            "token" => $token,
            "username" => $user['username'],
            "role" => $user['role']
        ]);
    } else {
        sendJsonResponse(["error" => "Invalid username or password"], 401);
    }
} elseif ($method === 'GET') {
    // Validate token endpoint
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        
        $stmt = $pdo->prepare("SELECT username, role, token_expires_at FROM users WHERE token = ?");
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        if ($user && strtotime($user['token_expires_at']) > time()) {
            sendJsonResponse([
                "valid" => true,
                "username" => $user['username'],
                "role" => $user['role']
            ]);
        } else {
            sendJsonResponse(["valid" => false, "error" => "Token invalid or expired"], 401);
        }
    } else {
        sendJsonResponse(["valid" => false, "error" => "No token provided"], 401);
    }
} else {
    sendJsonResponse(["error" => "Method not allowed"], 405);
}
?>
