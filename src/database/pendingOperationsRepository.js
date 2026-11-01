import { getDb } from './db';

export const OPERATION_TYPES = {
  ADD_TO_CART: 'ADD_TO_CART',
};

export const OPERATION_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
};

// Registra uma operação na fila, já como pendente
export async function createPendingOperation({ uuid, type, payload }) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO pending_operations
       (operation_uuid, type, payload, status, attempts, created_at)
     VALUES (?, ?, ?, ?, 0, ?)`,
    [uuid, type, JSON.stringify(payload), OPERATION_STATUS.PENDING, new Date().toISOString()]
  );
}

// Quantas operações ainda aguardam sincronização
export async function countUnsyncedOperations() {
  const db = await getDb();
  const row = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM pending_operations WHERE status IN (?, ?)',
    [OPERATION_STATUS.PENDING, OPERATION_STATUS.SYNCING]
  );
  return row.total;
}

// Descarta as operações pendentes de adicionar um produto (usado ao removê-lo do carrinho)
export async function discardPendingAddOperations(productId) {
  const db = await getDb();
  const operations = await db.getAllAsync(
    'SELECT id, payload FROM pending_operations WHERE type = ? AND status = ?',
    [OPERATION_TYPES.ADD_TO_CART, OPERATION_STATUS.PENDING]
  );

  for (const operation of operations) {
    if (JSON.parse(operation.payload).productId === productId) {
      await db.runAsync('DELETE FROM pending_operations WHERE id = ?', [operation.id]);
    }
  }
}