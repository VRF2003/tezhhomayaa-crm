const fs = require('fs');
const path = require('path');

function refactorFile(filepath, relativeServicePath) {
  if (!fs.existsSync(filepath)) return;
  
  let content = fs.readFileSync(filepath, 'utf8');

  // Replace import
  // e.g. import { db_quotes, db_buyers, db_settings } from './db.js';
  // or import { openDB, db_quotes, db_buyers, db_settings, executeMigrations, exportDatabase, importDatabase, db_products } from './db.js';
  
  const importRegex = new RegExp("import\\\\s+\\\\{[^}]+\\\\}\\\\s+from\\\\s+['\\\"]\\\\.\\\\/db\\\\.js['\\\"];?", "g");
  content = content.replace(importRegex, "import { DatabaseService } from '" + relativeServicePath + "DatabaseService.js';");

  // Replace methods mapping
  const replacements = {
    'db_settings.get()': 'DatabaseService.getSettings()',
    'db_settings.put(': 'DatabaseService.saveSettings(',
    
    'db_quotes.getAll(': 'DatabaseService.getQuotes(',
    'db_quotes.getById(': 'DatabaseService.getQuoteById(',
    'db_quotes.getByBuyer(': 'DatabaseService.getQuotesByBuyer(',
    'db_quotes.add(': 'DatabaseService.addQuote(',
    'db_quotes.put(': 'DatabaseService.saveQuote(',
    'db_quotes.delete(': 'DatabaseService.deleteQuote(',
    
    'db_buyers.getAll(': 'DatabaseService.getBuyers(',
    'db_buyers.getById(': 'DatabaseService.getBuyerById(',
    'db_buyers.getByName(': 'DatabaseService.getBuyerByName(',
    'db_buyers.add(': 'DatabaseService.addBuyer(',
    'db_buyers.put(': 'DatabaseService.saveBuyer(',
    'db_buyers.delete(': 'DatabaseService.deleteBuyer(',

    'db_products.getAll(': 'DatabaseService.getProducts(',
    'db_products.getById(': 'DatabaseService.getProductById(',
    'db_products.getByStyleCode(': 'DatabaseService.getProductByStyleCode(',
    'db_products.add(': 'DatabaseService.addProduct(',
    'db_products.put(': 'DatabaseService.saveProduct(',
    'db_products.delete(': 'DatabaseService.deleteProduct(',

    'openDB(': 'DatabaseService.openDB(',
    'executeMigrations(': 'DatabaseService.executeMigrations(',
    'exportDatabase(': 'DatabaseService.exportDatabase(',
    'importDatabase(': 'DatabaseService.importDatabase(',
  };

  for (const [oldStr, newStr] of Object.entries(replacements)) {
    content = content.split(oldStr).join(newStr);
  }

  // Handle db_quotes.getAll(), etc., without parenthesis if passed as references (like in Promise.all)
  content = content.replace(/db_quotes\.getAll(?![\w(])/g, 'DatabaseService.getQuotes()');
  content = content.replace(/db_buyers\.getAll(?![\w(])/g, 'DatabaseService.getBuyers()');
  content = content.replace(/db_products\.getAll(?![\w(])/g, 'DatabaseService.getProducts()');

  fs.writeFileSync(filepath, content);
  console.log('Refactored', filepath);
}

refactorFile(path.join(__dirname, 'src/crm.js'), './services/');
refactorFile(path.join(__dirname, 'src/main.js'), './services/');
refactorFile(path.join(__dirname, 'src/data.js'), './services/');
refactorFile(path.join(__dirname, 'src/search.js'), './services/');
