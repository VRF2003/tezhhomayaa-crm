// ============================================================
// db.js — IndexedDB wrapper for Tezhhomayaa Wholesale CRM
// ============================================================

const DB_NAME = 'TezhhomayaaCRM';
const DB_VERSION = 2;

let db = null;
let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const database = e.target.result;

      // ── quotes store ──────────────────────────────────────
      if (!database.objectStoreNames.contains('quotes')) {
        const qStore = database.createObjectStore('quotes', {
          keyPath: 'id', autoIncrement: true
        });
        qStore.createIndex('quoteNumber', 'quoteNumber', { unique: true });
        qStore.createIndex('date',        'date',        { unique: false });
        qStore.createIndex('buyerName',   'buyerName',   { unique: false });
        qStore.createIndex('country',     'country',     { unique: false });
      }

      // ── buyers store ─────────────────────────────────────
      if (!database.objectStoreNames.contains('buyers')) {
        const bStore = database.createObjectStore('buyers', {
          keyPath: 'id', autoIncrement: true
        });
        bStore.createIndex('name',    'name',    { unique: false });
        bStore.createIndex('company', 'company', { unique: false });
        bStore.createIndex('country', 'country', { unique: false });
      }

      // ── settings store ───────────────────────────────────
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'id' });
      }
    };

    req.onsuccess = (e) => {
      db = e.target.result;
      
      db.onclose = () => {
        db = null;
        dbPromise = null;
      };
      
      db.onversionchange = () => {
        db.close();
        db = null;
        dbPromise = null;
      };
      
      resolve(db);
    };

    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });

  return dbPromise;
}

// ── Generic helpers ─────────────────────────────────────────

async function tx(storeName, mode = 'readonly') {
  if (!db) await openDB();
  try {
    return db.transaction(storeName, mode).objectStore(storeName);
  } catch (err) {
    if (err.name === 'InvalidStateError' && err.message.includes('closing')) {
      db = null;
      dbPromise = null;
      await openDB();
      return db.transaction(storeName, mode).objectStore(storeName);
    }
    throw err;
  }
}

function promisify(req) {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror  = () => rej(req.error);
  });
}

async function getAll(storeName) {
  const store = await tx(storeName);
  return promisify(store.getAll());
}

async function getById(storeName, id) {
  const store = await tx(storeName);
  return promisify(store.get(id));
}

async function add(storeName, record) {
  const store = await tx(storeName, 'readwrite');
  return promisify(store.add(record));
}

async function put(storeName, record) {
  const store = await tx(storeName, 'readwrite');
  return promisify(store.put(record));
}

async function getByIndex(storeName, indexName, value) {
  const store = await tx(storeName);
  return promisify(store.index(indexName).getAll(value));
}

// ── Public API ───────────────────────────────────────────────

export const db_quotes = {
  add:    (q)  => add('quotes', q),
  getAll: ()   => getAll('quotes'),
  getById:(id) => getById('quotes', id),
  getByBuyer: (name) => getByIndex('quotes', 'buyerName', name),
  delete: async (id) => {
    const store = await tx('quotes', 'readwrite');
    return promisify(store.delete(id));
  },
  put:    (q)  => put('quotes', q),
};

export const db_buyers = {
  add:    (b) => add('buyers', b),
  put:    (b) => put('buyers', b),
  getAll: ()  => getAll('buyers'),
  getById:(id) => getById('buyers', id),
  getByName: (name) => getByIndex('buyers', 'name', name),
  delete: async (id) => {
    const store = await tx('buyers', 'readwrite');
    return promisify(store.delete(id));
  },
};

export const db_settings = {
  get: () => getById('settings', 'pdf_settings'),
  put: (settings) => put('settings', { id: 'pdf_settings', ...settings }),
};

// ── Database Migration Engine ──────────────────────────────
const CURRENT_MIGRATION_VERSION = 1;

export async function executeMigrations() {
  const s = await db_settings.get() || {};
  const currentVer = s.migrationVersion || 0;

  if (currentVer >= CURRENT_MIGRATION_VERSION) return false;

  console.log(`Migrating database from version \${currentVer} to \${CURRENT_MIGRATION_VERSION}...`);

  // Migration 1: Add default fields to Quotes and Buyers
  if (currentVer < 1) {
    const allQuotes = await db_quotes.getAll();
    for (let q of allQuotes) {
      let updated = false;
      if (!q.status) { q.status = 'Draft'; updated = true; }
      if (!q.phone) { q.phone = ''; updated = true; }
      if (!q.email) { q.email = ''; updated = true; }
      if (!q.whatsapp) { q.whatsapp = ''; updated = true; }
      if (!q.buyerType) { q.buyerType = ''; updated = true; }
      if (updated) await db_quotes.put(q);
    }

    const allBuyers = await db_buyers.getAll();
    for (let b of allBuyers) {
      let updated = false;
      if (!b.phone) { b.phone = ''; updated = true; }
      if (!b.email) { b.email = ''; updated = true; }
      if (!b.whatsapp) { b.whatsapp = ''; updated = true; }
      if (!b.buyerType) { b.buyerType = ''; updated = true; }
      if (updated) await db_buyers.put(b);
    }
  }

  // Update migration version
  s.migrationVersion = CURRENT_MIGRATION_VERSION;
  await db_settings.put(s);
  
  // Dispatch event for UI
  window.dispatchEvent(new CustomEvent('db-migrated', { detail: { version: CURRENT_MIGRATION_VERSION } }));
  return true;
}

// ── Backup and Restore ─────────────────────────────────────

export async function exportDatabase() {
  const data = {
    quotes: await db_quotes.getAll(),
    buyers: await db_buyers.getAll(),
    settings: await db_settings.get()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `Tezhhomayaa_CRM_Backup_\${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

export async function importDatabase(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    if (!data.quotes || !data.buyers) throw new Error("Invalid CRM Backup File");

    // Clear existing data (within a new transaction for safety if possible, but clear each store is easiest)
    const quoteStore = await tx('quotes', 'readwrite');
    await promisify(quoteStore.clear());
    const buyerStore = await tx('buyers', 'readwrite');
    await promisify(buyerStore.clear());

    // Import Quotes
    for (const q of data.quotes) {
      // Re-insert exactly as is
      await db_quotes.add(q);
    }
    
    // Import Buyers
    for (const b of data.buyers) {
      await db_buyers.add(b);
    }
    
    // Import Settings
    if (data.settings) {
      await db_settings.put(data.settings);
    }

    return true;
  } catch (err) {
    console.error("Import failed:", err);
    throw err;
  }
}
