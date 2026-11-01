import * as SQLite from 'expo-sqlite';

let dbPromise = null;
let transactionQueue = Promise.resolve();

// Abre o banco uma única vez e reaproveita a mesma conexão em todo o app
export function getDb() {
  if (!dbPromise) {
    dbPromise = openAndSetup().catch((error) => {
      dbPromise = null; // se falhou, permite tentar de novo depois
      throw error;
    });
  }
  return dbPromise;
}

// Agrupa várias operações em uma só: ou todas dão certo, ou nenhuma é aplicada.
// As transações rodam uma de cada vez, porque o SQLite não aceita abrir
// uma transação dentro de outra (toques rápidos poderiam causar isso)
export function runInTransaction(task) {
  const result = transactionQueue.then(async () => {
    const db = await getDb();
    await db.withTransactionAsync(task);
  });
  transactionQueue = result.catch(() => {}); // o erro de uma não trava as seguintes
  return result;
}

async function openAndSetup() {
  const db = await SQLite.openDatabaseAsync('sempher.db');

  // IF NOT EXISTS: só cria a tabela se ela ainda não existir
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      thumbnail TEXT,
      category TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      product_id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      thumbnail TEXT,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_uuid TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'syncing', 'synced', 'failed')),
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );
  `);

  return db;
}