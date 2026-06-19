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
