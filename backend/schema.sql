-- ==========================================================
-- Tezhhomayaa ERP Database Schema
-- ==========================================================

-- 1. Users (For Future Authentication & Roles)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('admin', 'manager', 'sales', 'production') DEFAULT 'sales',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Settings (Key-Value Store for Global Settings)
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Buyers
CREATE TABLE IF NOT EXISTS buyers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    whatsapp VARCHAR(50),
    buyer_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Products (Product Master & Inventory Base)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    style_code VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    design VARCHAR(100),
    colour VARCHAR(100),
    tier VARCHAR(50),
    image_url VARCHAR(500),
    base_cost DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Quotes / Orders
CREATE TABLE IF NOT EXISTS quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_number VARCHAR(100) UNIQUE NOT NULL,
    buyer_id INT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft',
    total_value DECIMAL(12,2) DEFAULT 0.00,
    payment_terms VARCHAR(255),
    shipping_terms VARCHAR(255),
    
    -- Production Fields
    production_status VARCHAR(50) DEFAULT 'Waiting',
    expected_start_date DATE NULL,
    expected_finish_date DATE NULL,
    production_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE RESTRICT
);

-- 6. Quote Items (Relational Link between Quotes and Products)
CREATE TABLE IF NOT EXISTS quote_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    product_id INT NOT NULL,
    qty INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    size_breakdown JSON, -- Stores sizes like {"S": 10, "M": 20}
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ==========================================================
-- Initial Setup
-- ==========================================================
-- Insert a blank settings row so the application can update it later
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('pdf_settings', '{}');
