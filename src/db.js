// ============================================================
// db.js — IndexedDB wrapper for Tezhhomayaa Wholesale CRM
// ============================================================

const DB_NAME = 'TezhhomayaaCRM';
const DB_VERSION = 2;

let db = null;

export function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

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
      resolve(db);
    };

    req.onerror = () => reject(req.error);
  });
}

// ── Generic helpers ─────────────────────────────────────────

function tx(storeName, mode = 'readonly') {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function promisify(req) {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror  = () => rej(req.error);
  });
}

function getAll(storeName) {
  return promisify(tx(storeName).getAll());
}

function getById(storeName, id) {
  return promisify(tx(storeName).get(id));
}

function add(storeName, record) {
  return promisify(tx(storeName, 'readwrite').add(record));
}

function put(storeName, record) {
  return promisify(tx(storeName, 'readwrite').put(record));
}

function getByIndex(storeName, indexName, value) {
  return promisify(tx(storeName).index(indexName).getAll(value));
}

// ── Public API ───────────────────────────────────────────────

export const db_quotes = {
  add:    (q)  => add('quotes', q),
  getAll: ()   => getAll('quotes'),
  getById:(id) => getById('quotes', id),
  getByBuyer: (name) => getByIndex('quotes', 'buyerName', name),
  delete: (id) => promisify(tx('quotes', 'readwrite').delete(id)),
  put:    (q)  => put('quotes', q),
};

export const db_buyers = {
  add:    (b) => add('buyers', b),
  put:    (b) => put('buyers', b),
  getAll: ()  => getAll('buyers'),
  getById:(id) => getById('buyers', id),
  getByName: (name) => getByIndex('buyers', 'name', name),
  delete: (id) => promisify(tx('buyers', 'readwrite').delete(id)),
};

export const db_settings = {
  get: () => getById('settings', 'pdf_settings'),
  put: (settings) => put('settings', { id: 'pdf_settings', ...settings }),
};
