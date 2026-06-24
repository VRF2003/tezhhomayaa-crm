<?php
// admin_api.php
require_once 'auth.php';

// Production Security Settings
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$user = require_auth();
$request_method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? '';
$id = $_GET['id'] ?? null;
$action = ($request_method === 'GET') ? 'view' : 'edit';
$input_data = json_decode(file_get_contents('php://input'), true);

switch ($resource) {
    case 'users':
        require_permission($pdo, $user['user_id'], 'users', $action);
        handleUsers($pdo, $request_method, $id, $input_data);
        break;
    case 'roles':
        // Only Super Admin can manage roles
        require_permission($pdo, $user['user_id'], 'users', $action);
        handleRoles($pdo, $request_method, $id, $input_data);
        break;
    case 'permissions':
        require_permission($pdo, $user['user_id'], 'users', 'view');
        handlePermissions($pdo, $request_method);
        break;
    case 'audit_logs':
        // Only Super Admin should view audit logs realistically, but we tie it to users.view for now
        require_permission($pdo, $user['user_id'], 'users', 'view');
        handleLogs($pdo, $request_method);
        break;
    default:
        http_response_code(404);
        echo json_encode(["error" => "Resource not found"]);
        break;
}

function handleUsers($pdo, $method, $id, $data) {
    global $user;
    if ($method == 'GET') {
        $stmt = $pdo->query("SELECT u.id, u.name, u.email, u.status, u.created_at, u.last_login, GROUP_CONCAT(r.name) as roles, GROUP_CONCAT(r.id) as role_ids FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id GROUP BY u.id");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } elseif ($method == 'POST') {
        // Create user
        $hash = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, status) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['email'], $hash, $data['status'] ?? 'Active']);
        $newId = $pdo->lastInsertId();
        
        if (!empty($data['roles'])) {
            foreach ($data['roles'] as $role_id) {
                $pdo->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)")->execute([$newId, $role_id]);
            }
        }
        log_audit_action($pdo, $user['user_id'], 'create_user', 'users', $newId, ['email' => $data['email']]);
        echo json_encode(['message' => 'User created']);
    } elseif ($method == 'PUT' && $id) {
        // Update user
        if (!empty($data['password'])) {
            $hash = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET name=?, email=?, status=?, password_hash=? WHERE id=?");
            $stmt->execute([$data['name'], $data['email'], $data['status'], $hash, $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name=?, email=?, status=? WHERE id=?");
            $stmt->execute([$data['name'], $data['email'], $data['status'], $id]);
        }
        
        $pdo->prepare("DELETE FROM user_roles WHERE user_id=?")->execute([$id]);
        if (!empty($data['roles'])) {
            foreach ($data['roles'] as $role_id) {
                $pdo->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)")->execute([$id, $role_id]);
            }
        }
        log_audit_action($pdo, $user['user_id'], 'update_user', 'users', $id, ['email' => $data['email']]);
        echo json_encode(['message' => 'User updated']);
    } elseif ($method == 'DELETE' && $id) {
        $pdo->prepare("DELETE FROM users WHERE id=?")->execute([$id]);
        log_audit_action($pdo, $user['user_id'], 'delete_user', 'users', $id);
        echo json_encode(['message' => 'User deleted']);
    }
}

function handleRoles($pdo, $method, $id, $data) {
    global $user;
    if ($method == 'GET') {
        $roles = $pdo->query("SELECT * FROM roles")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($roles as &$r) {
            $stmt = $pdo->prepare("SELECT permission_id FROM role_permissions WHERE role_id = ?");
            $stmt->execute([$r['id']]);
            $r['permissions'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        }
        echo json_encode($roles);
    } elseif ($method == 'POST') {
        $stmt = $pdo->prepare("INSERT INTO roles (name, description) VALUES (?, ?)");
        $stmt->execute([$data['name'], $data['description'] ?? '']);
        $newId = $pdo->lastInsertId();
        
        if (!empty($data['permissions'])) {
            foreach ($data['permissions'] as $perm_id) {
                $pdo->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)")->execute([$newId, $perm_id]);
            }
        }
        log_audit_action($pdo, $user['user_id'], 'create_role', 'roles', $newId, ['name' => $data['name']]);
        echo json_encode(['message' => 'Role created']);
    } elseif ($method == 'PUT' && $id) {
        $stmt = $pdo->prepare("UPDATE roles SET name=?, description=? WHERE id=?");
        $stmt->execute([$data['name'], $data['description'] ?? '', $id]);
        
        $pdo->prepare("DELETE FROM role_permissions WHERE role_id=?")->execute([$id]);
        if (!empty($data['permissions'])) {
            foreach ($data['permissions'] as $perm_id) {
                $pdo->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)")->execute([$id, $perm_id]);
            }
        }
        log_audit_action($pdo, $user['user_id'], 'update_role', 'roles', $id, ['name' => $data['name']]);
        echo json_encode(['message' => 'Role updated']);
    } elseif ($method == 'DELETE' && $id) {
        // Don't delete system roles
        $stmt = $pdo->prepare("SELECT is_system FROM roles WHERE id=?");
        $stmt->execute([$id]);
        if ($stmt->fetchColumn()) {
            http_response_code(403);
            echo json_encode(['error' => 'Cannot delete a system role']);
            exit;
        }
        $pdo->prepare("DELETE FROM roles WHERE id=?")->execute([$id]);
        log_audit_action($pdo, $user['user_id'], 'delete_role', 'roles', $id);
        echo json_encode(['message' => 'Role deleted']);
    }
}

function handlePermissions($pdo, $method) {
    if ($method == 'GET') {
        echo json_encode($pdo->query("SELECT * FROM permissions")->fetchAll(PDO::FETCH_ASSOC));
    }
}

function handleLogs($pdo, $method) {
    if ($method == 'GET') {
        echo json_encode($pdo->query("SELECT a.*, u.name as user_name, u.email as user_email FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.id DESC LIMIT 1000")->fetchAll(PDO::FETCH_ASSOC));
    }
}
?>
