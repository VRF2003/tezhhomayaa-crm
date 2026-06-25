const fs = require('fs');
const path = require('path');

const dirs = [
  'backend/api',
  'backend/config',
  'backend/middleware',
  'backend/helpers',
  'backend/uploads',
  'backend/logs',
  'src/services'
];

dirs.forEach(d => {
  fs.mkdirSync(path.join(__dirname, d), { recursive: true });
});

const apiFiles = [
  'products.php', 'buyers.php', 'quotes.php', 'inventory.php',
  'production.php', 'reports.php', 'auth.php', 'settings.php'
];

apiFiles.forEach(f => {
  const content = `<?php
/**
 * Placeholder for ${f} API
 * This file will handle the CRUD operations for ${f.replace('.php', '')}
 * once the MySQL database is active.
 */
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// TODO: Implement endpoints
echo json_encode(["message" => "Endpoint ${f} not implemented yet"]);
`;
  fs.writeFileSync(path.join(__dirname, 'backend/api', f), content);
});

const dbPhp = `<?php
/**
 * Database Configuration (Placeholder)
 * This file sets up the PDO connection to the MySQL database
 * using environment variables.
 */

/*
$host = getenv('DB_HOST');
$db   = getenv('DB_DATABASE');
$user = getenv('DB_USERNAME');
$pass = getenv('DB_PASSWORD');
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\\PDOException $e) {
     throw new \\PDOException($e->getMessage(), (int)$e->getCode());
}
*/
`;
fs.writeFileSync(path.join(__dirname, 'backend/config/db.php'), dbPhp);

const envExample = `DB_HOST=
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
API_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
JWT_SECRET=
`;
fs.writeFileSync(path.join(__dirname, '.env.example'), envExample);

const readmeMig = `# Architecture Migration Guide

## Current Architecture
The application currently uses **IndexedDB** for local browser storage. All data is managed locally and there is no cloud database.

## Future Architecture
We are transitioning to a true SaaS model using **PHP** as the REST API backend and **MySQL** as the relational database.

## Migration Order
1. **IndexedDB** (Current state)
2. **PHP API + MySQL** (Centralized relational database)
3. **Cloudinary** (Media asset offloading)
4. **Authentication** (Firebase Auth login layer)

The \`src/services/\` layer has been created to decouple the UI from IndexedDB. Once the PHP API is live, you only need to update the \`src/services/\` files to point to the new endpoints. No other UI components will need to change.
`;
fs.writeFileSync(path.join(__dirname, 'README_MIGRATION.md'), readmeMig);

const apiService = `/**
 * ApiService - Placeholder
 * This service will handle all outbound HTTP requests to the PHP backend.
 * It will manage JWT tokens and error handling.
 */

export const ApiService = {
  async get(endpoint) {
    // throw new Error("Not implemented");
  },
  
  async post(endpoint, data) {
    // throw new Error("Not implemented");
  },
  
  async put(endpoint, data) {
    // throw new Error("Not implemented");
  },
  
  async delete(endpoint) {
    // throw new Error("Not implemented");
  }
};
`;
fs.writeFileSync(path.join(__dirname, 'src/services/ApiService.js'), apiService);

const storageService = `/**
 * StorageService - Placeholder
 * This service will handle media uploads (e.g. Cloudinary).
 */

export const StorageService = {
  async uploadImage(file) {
    // throw new Error("Not implemented");
  },
  
  getImageUrl(id) {
    // return \`https://res.cloudinary.com/.../\${id}\`;
  }
};
`;
fs.writeFileSync(path.join(__dirname, 'src/services/StorageService.js'), storageService);

const authService = `/**
 * AuthService - Placeholder
 * This service will manage User Authentication (Firebase Auth) and role permissions.
 */

export const AuthService = {
  async login(email, password) {
    // throw new Error("Not implemented");
  },
  
  async logout() {
    // throw new Error("Not implemented");
  },
  
  getCurrentUser() {
    return null;
  },
  
  hasPermission(role) {
    return true; // default true for now
  }
};
`;
fs.writeFileSync(path.join(__dirname, 'src/services/AuthService.js'), authService);

const reportService = `/**
 * ReportService - Placeholder
 * Unified reporting and export service (Excel, PDF, CSV).
 */

export const ReportService = {
  exportToExcel(data, filename) {
    // throw new Error("Not implemented");
  },
  
  exportToPDF(data, filename) {
    // throw new Error("Not implemented");
  },
  
  exportToCSV(data, filename) {
    // throw new Error("Not implemented");
  }
};
`;
fs.writeFileSync(path.join(__dirname, 'src/services/ReportService.js'), reportService);

const dbService = `/**
 * DatabaseService
 * The central data layer for the frontend. 
 * Currently wraps IndexedDB calls to maintain compatibility.
 * In the future, this will be rewritten to use ApiService calls.
 */

import { db_quotes, db_buyers, db_settings, db_products, executeMigrations, exportDatabase, importDatabase, openDB } from '../db.js';

export const DatabaseService = {
  // Initialization & System
  openDB: openDB,
  executeMigrations: executeMigrations,
  exportDatabase: exportDatabase,
  importDatabase: importDatabase,

  // Settings
  getSettings: () => db_settings.get(),
  saveSettings: (settings) => db_settings.put(settings),

  // Buyers
  getBuyers: () => db_buyers.getAll(),
  getBuyerById: (id) => db_buyers.getById(id),
  getBuyerByName: (name) => db_buyers.getByName(name),
  saveBuyer: (buyer) => db_buyers.put(buyer),
  addBuyer: (buyer) => db_buyers.add(buyer),
  deleteBuyer: (id) => db_buyers.delete(id),

  // Products
  getProducts: () => db_products.getAll(),
  getProductById: (id) => db_products.getById(id),
  getProductByStyleCode: (code) => db_products.getByStyleCode(code),
  saveProduct: (product) => db_products.put(product),
  addProduct: (product) => db_products.add(product),
  deleteProduct: (id) => db_products.delete(id),

  // Quotes / Orders
  getQuotes: () => db_quotes.getAll(),
  getQuoteById: (id) => db_quotes.getById(id),
  getQuotesByBuyer: (name) => db_quotes.getByBuyer(name),
  saveQuote: (quote) => db_quotes.put(quote),
  addQuote: (quote) => db_quotes.add(quote),
  deleteQuote: (id) => db_quotes.delete(id)
};
`;
fs.writeFileSync(path.join(__dirname, 'src/services/DatabaseService.js'), dbService);

console.log("Boilerplates created successfully.");
