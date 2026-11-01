import * as SQLite from 'expo-sqlite';

let dbPromise = null;

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
  `);

  return db;
}