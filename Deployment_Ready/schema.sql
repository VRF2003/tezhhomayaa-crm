-- --------------------------------------------------------
-- Tezhhomayaa Buyer App - MySQL Database Schema
-- --------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure for table `products`
-- --------------------------------------------------------
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `productName` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `silhouette` varchar(100) DEFAULT 'Uncategorized',
  `overrideMoq` int(11) DEFAULT NULL,
  `design` varchar(100) NOT NULL,
  `colour` varchar(100) NOT NULL,
  `styleCode` varchar(100) NOT NULL,
  `fabric` varchar(255) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT '0.00',
  `finalCost` decimal(10,2) DEFAULT '0.00',
  `retailPrice` decimal(10,2) DEFAULT '0.00',
  `wholesale50` decimal(10,2) DEFAULT '0.00',
  `wholesale40` decimal(10,2) DEFAULT '0.00',
  `wholesale30` decimal(10,2) DEFAULT '0.00',
  `status` varchar(50) DEFAULT 'Active',
  `image` longtext DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `styleCode` (`styleCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------
-- Table structure for table `quotes`
-- --------------------------------------------------------
CREATE TABLE `quotes` (
  `id` varchar(100) NOT NULL,
  `buyerName` varchar(255) NOT NULL,
  `company` varchar(255) NOT NULL,
  `country` varchar(100) NOT NULL,
  `mobile` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(50) DEFAULT NULL,
  `buyerType` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Draft',
  `itemCount` int(11) DEFAULT 0,
  `totalCost` decimal(10,2) DEFAULT 0.00,
  `totalValue` decimal(10,2) DEFAULT 0.00,
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------
-- Table structure for table `quote_items`
-- --------------------------------------------------------
CREATE TABLE `quote_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quote_id` varchar(100) NOT NULL,
  `styleCode` varchar(100) NOT NULL,
  `productName` varchar(255) NOT NULL,
  `design` varchar(100) NOT NULL,
  `colour` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `silhouette` varchar(100) DEFAULT 'Uncategorized',
  `overrideMoq` int(11) DEFAULT NULL,
  `tier` varchar(50) NOT NULL,
  `unitPrice` decimal(10,2) NOT NULL,
  `sizes` json NOT NULL,
  `qty` int(11) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `image` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quote_id` (`quote_id`),
  CONSTRAINT `fk_quote_items_quotes` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------
-- Table structure for table `settings`
-- --------------------------------------------------------
CREATE TABLE `settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` json NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('pdfSettings', '{"companyName":"Tezhhomayaa Sdn Bhd","companyAddress":"Kuala Lumpur, Malaysia","companyPhone":"+60 123 456 789","companyEmail":"info@tezhhomayaa.com","companyWebsite":"www.tezhhomayaa.com","bankName":"","bankAccount":"","bankSwift":"","terms":"50% Deposit required. Balance before shipment.","currency":"MYR","silhouetteMoqs":{}}');

COMMIT;

-- --------------------------------------------------------
-- RBAC Auth & Security Module
-- --------------------------------------------------------

CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `module_action` (`module`,`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_perm` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `target_table` varchar(100) DEFAULT NULL,
  `target_id` varchar(100) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `meta_json` json DEFAULT NULL,
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Data: Roles
INSERT INTO `roles` (`id`, `name`, `description`, `is_system`) VALUES
(1, 'Super Admin', 'Full access to all system features', 1),
(2, 'Admin', 'Can manage products, quotes, and reports', 1),
(3, 'Manager', 'Can track and view data but not alter core configurations', 1),
(4, 'Support', 'Can only view quotes and buyer details', 1);

-- Seed Data: Permissions
INSERT INTO `permissions` (`id`, `module`, `action`, `description`) VALUES
(1, 'products', 'view', 'View Products'),
(2, 'products', 'edit', 'Add/Edit/Delete Products'),
(3, 'quotes', 'view', 'View Quotes and Orders'),
(4, 'quotes', 'edit', 'Create/Edit/Delete Quotes'),
(5, 'buyers', 'view', 'View Buyers Directory'),
(6, 'buyers', 'edit', 'Add/Edit/Delete Buyers'),
(7, 'settings', 'view', 'View System Settings'),
(8, 'settings', 'edit', 'Modify System Settings'),
(9, 'users', 'view', 'View Staff Users'),
(10, 'users', 'edit', 'Manage Staff Users & Roles');

-- Seed Data: Assign Permissions to Roles
-- Super Admin (1) gets all
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
-- Admin (2) gets everything except users/settings edit
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7),
-- Manager (3) gets view everything, edit quotes
(3, 1), (3, 3), (3, 4), (3, 5), (3, 7),
-- Support (4) gets view quotes and buyers
(4, 3), (4, 5);

-- Seed Data: Default Super Admin User (password: admin123)
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `status`) VALUES
(1, 'System Admin', 'admin@tezhhomayaa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Active');
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES (1, 1);

