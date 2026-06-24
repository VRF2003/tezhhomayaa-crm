<?php
// auth.php
require_once 'db.php';

// A simple JWT implementation
define('JWT_SECRET', 'Tezhhomayaa_Super_Secret_Key_Change_In_Production!');

function generate_jwt($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verify_jwt($jwt) {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return false;
    list($header, $payload, $signature) = $parts;
    $validSignature = hash_hmac('sha256', $header . "." . $payload, JWT_SECRET, true);
    $base64UrlValidSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($validSignature));
    if (hash_equals($base64UrlValidSignature, $signature)) {
        return json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
    }
    return false;
}

function get_bearer_token() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function require_auth() {
    $token = get_bearer_token();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized: No token provided']);
        exit;
    }
    $decoded = verify_jwt($token);
    if (!$decoded || !isset($decoded['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized: Invalid or expired token']);
        exit;
    }
    if (isset($decoded['exp']) && $decoded['exp'] < time()) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized: Token expired']);
        exit;
    }
    return $decoded;
}

function get_user_permissions($pdo, $user_id) {
    $stmt = $pdo->prepare("
        SELECT DISTINCT p.module, p.action 
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ?
    ");
    $stmt->execute([$user_id]);
    $perms = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $permMap = [];
    foreach ($perms as $p) {
        if (!isset($permMap[$p['module']])) {
            $permMap[$p['module']] = [];
        }
        $permMap[$p['module']][] = $p['action'];
    }
    return $permMap;
}

function require_permission($pdo, $user_id, $module, $action) {
    $perms = get_user_permissions($pdo, $user_id);
    if (!isset($perms[$module]) || !in_array($action, $perms[$module])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: You do not have permission to perform this action.']);
        exit;
    }
}

function log_audit_action($pdo, $user_id, $action, $target_table, $target_id, $meta_json = null) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, target_table, target_id, ip_address, meta_json) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$user_id, $action, $target_table, $target_id, $ip, $meta_json ? json_encode($meta_json) : null]);
}

// Handle Login Request Directly if this file is called
if (basename($_SERVER['PHP_SELF']) == 'auth.php') {
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password required']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id, name, password_hash, status FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password_hash'])) {
            if ($user['status'] !== 'Active') {
                http_response_code(403);
                echo json_encode(['error' => 'Account is deactivated']);
                exit;
            }

            // Update last login
            $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?")->execute([$user['id']]);

            // Get permissions to send to frontend
            $permissions = get_user_permissions($pdo, $user['id']);

            $payload = [
                'user_id' => $user['id'],
                'name' => $user['name'],
                'email' => $email,
                'exp' => time() + (86400 * 7) // 7 days expiration
            ];
            $jwt = generate_jwt($payload);
            
            log_audit_action($pdo, $user['id'], 'login', 'users', $user['id']);

            echo json_encode([
                'token' => $jwt,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $email,
                    'permissions' => $permissions
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid email or password']);
        }
    }
}
?>
