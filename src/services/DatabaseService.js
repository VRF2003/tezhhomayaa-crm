/**
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
