<?php
// backend/setup_users_table.php
require_once __DIR__ . '/config/db.php';

echo "<h1>Setting up Users Table...</h1>";

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        token VARCHAR(128) DEFAULT NULL,
        token_expires_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    echo "<p>✅ Users table created successfully.</p>";

    // Insert default admin if not exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $defaultPassword = 'Tezhhomayaa2026!';
        $hash = password_hash($defaultPassword, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)");
        $stmt->execute(['admin', $hash, 'master']);
        echo "<p>✅ Default master admin account created.</p>";
        echo "<p><strong>Username:</strong> admin</p>";
        echo "<p><strong>Password:</strong> Tezhhomayaa2026!</p>";
    } else {
        echo "<p>ℹ️ Admin account already exists.</p>";
    }

    echo "<h2 style='color:green;'>Setup Complete!</h2>";

} catch (Exception $e) {
    echo "<h2 style='color:red;'>Setup Failed!</h2>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
