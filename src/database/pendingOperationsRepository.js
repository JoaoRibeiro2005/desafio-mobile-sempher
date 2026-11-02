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

// Descarta as operações pendentes ou com falha de um produto (usado ao removê-lo do carrinho)
export async function discardPendingAddOperations(productId) {
  const db = await getDb();
  const operations = await db.getAllAsync(
    'SELECT id, payload FROM pending_operations WHERE type = ? AND status IN (?, ?)',
    [OPERATION_TYPES.ADD_TO_CART, OPERATION_STATUS.PENDING, OPERATION_STATUS.FAILED]
  );

  for (const operation of operations) {
    if (JSON.parse(operation.payload).productId === productId) {
      await db.runAsync('DELETE FROM pending_operations WHERE id = ?', [operation.id]);
    }
  }
}

// ===== Usadas pela sincronização =====

// Operações a enviar, da mais antiga para a mais nova
export async function getPendingOperations() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM pending_operations WHERE status = ? ORDER BY id', [
    OPERATION_STATUS.PENDING,
  ]);
}

// "Reserva" a operação: só troca para syncing se ela ainda estiver pending.
// Devolve true se conseguiu (ou seja, esta execução é a dona do envio)
export async function claimOperation(id) {
  const db = await getDb();
  const result = await db.runAsync(
    'UPDATE pending_operations SET status = ? WHERE id = ? AND status = ?',
    [OPERATION_STATUS.SYNCING, id, OPERATION_STATUS.PENDING]
  );
  return result.changes === 1;
}

export async function markOperationSynced(id) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE pending_operations SET status = ?, synced_at = ?, last_error = NULL WHERE id = ?',
    [OPERATION_STATUS.SYNCED, new Date().toISOString(), id]
  );
}

// Registra uma falha de envio.
// countAttempt = true: erro do servidor (gasta uma tentativa; na última vira failed)
// countAttempt = false: sem conexão (volta para pending sem gastar tentativa)
export async function recordOperationFailure(id, message, countAttempt, maxAttempts) {
  const db = await getDb();

  if (countAttempt) {
    await db.runAsync(
      `UPDATE pending_operations
          SET attempts = attempts + 1,
              status = CASE WHEN attempts + 1 >= ? THEN ? ELSE ? END,
              last_error = ?
        WHERE id = ?`,
      [maxAttempts, OPERATION_STATUS.FAILED, OPERATION_STATUS.PENDING, message, id]
    );
  } else {
    await db.runAsync('UPDATE pending_operations SET status = ?, last_error = ? WHERE id = ?', [
      OPERATION_STATUS.PENDING,
      message,
      id,
    ]);
  }
}

// Operações que ficaram em syncing (o app fechou no meio do envio) voltam para pending
export async function resetSyncingOperations() {
  const db = await getDb();
  await db.runAsync('UPDATE pending_operations SET status = ? WHERE status = ?', [
    OPERATION_STATUS.PENDING,
    OPERATION_STATUS.SYNCING,
  ]);
}

// Ainda existe alguma operação deste produto que não foi sincronizada?
export async function hasUnsyncedOperationsForProduct(productId) {
  const db = await getDb();
  const operations = await db.getAllAsync(
    'SELECT payload FROM pending_operations WHERE type = ? AND status != ?',
    [OPERATION_TYPES.ADD_TO_CART, OPERATION_STATUS.SYNCED]
  );
  return operations.some((operation) => JSON.parse(operation.payload).productId === productId);
}