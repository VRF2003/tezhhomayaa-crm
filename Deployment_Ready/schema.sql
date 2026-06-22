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
