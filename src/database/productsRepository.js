import { getDb, runInTransaction } from './db';

// Salva (ou atualiza) uma lista de produtos no cache local
export async function saveProducts(products) {
  const db = await getDb();
  const now = new Date().toISOString();

  // Transação: ou todos os produtos são gravados, ou nenhum
  await runInTransaction(async () => {
    for (const p of products) {
      await db.runAsync(
        `INSERT OR REPLACE INTO products
           (id, title, description, price, thumbnail, category, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.title,
          p.description ?? null,
          p.price,
          p.thumbnail ?? null,
          p.category ?? null,
          now,
        ]
      );
    }
  });
}

// Lê uma página de produtos salvos, na mesma ordem da API
export async function getCachedProducts({ limit, offset }) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM products ORDER BY id LIMIT ? OFFSET ?', [limit, offset]);
}

// Quantos produtos existem salvos
export async function countCachedProducts() {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT COUNT(*) AS total FROM products');
  return row.total;
}

// Lê um produto salvo pelo id (devolve null se não existir)
export async function getCachedProductById(id) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM products WHERE id = ?', [id]);
}