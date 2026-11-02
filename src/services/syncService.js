import { request } from './api';
import { runInTransaction } from '../database/db';
import { setCartItemSyncStatus } from '../database/cartRepository';
import {
  OPERATION_TYPES,
  getPendingOperations,
  claimOperation,
  markOperationSynced,
  recordOperationFailure,
  resetSyncingOperations,
  hasUnsyncedOperationsForProduct,
} from '../database/pendingOperationsRepository';

const MAX_ATTEMPTS = 5; // tentativas com erro do servidor antes de marcar como failed

let isSyncing = false; // trava: só uma sincronização por vez
let rerunRequested = false; // chegou pedido novo enquanto sincronizava
const listeners = new Set();

// Quem quiser saber quando a sincronização muda algo (ex.: o carrinho) se inscreve aqui
export function onSyncProgress(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

// Chamada ao abrir o app, antes da primeira sincronização: nenhuma está rodando
// ainda, então o que ficou em "syncing" foi interrompido pelo fechamento do app
export async function recoverInterruptedOperations() {
  await runInTransaction(() => resetSyncingOperations());
}

// Envia as operações pendentes para a API, da mais antiga para a mais nova
export async function syncPendingOperations() {
  if (isSyncing) {
    rerunRequested = true; // ao terminar, confere de novo se chegou algo novo
    return;
  }

  isSyncing = true;
  try {
    let stop = false;
    do {
      rerunRequested = false;
      stop = await processQueue();
    } while (rerunRequested && !stop);
  } catch (error) {
    console.warn('Erro ao sincronizar:', error);
  } finally {
    isSyncing = false;
    notify();
  }
}

// Devolve true quando deve parar (sem conexão): as próximas também falhariam
async function processQueue() {
  const operations = await getPendingOperations();

  for (const operation of operations) {
    // Reserva a operação antes de enviar
    let claimed = false;
    await runInTransaction(async () => {
      claimed = await claimOperation(operation.id);
    });
    if (!claimed) continue; // outra execução já pegou esta
    notify();

    try {
      await sendOperation(operation);
    } catch (error) {
      // Sem conexão não gasta tentativa; erro do servidor gasta
      await runInTransaction(() =>
        recordOperationFailure(operation.id, error.message, !error.isNetworkError, MAX_ATTEMPTS)
      );
      notify();
      if (error.isNetworkError) return true;
      continue;
    }

    // Enviada com sucesso: a operação e o estado do item mudam juntos
    const { productId } = JSON.parse(operation.payload);
    await runInTransaction(async () => {
      await markOperationSynced(operation.id);
      if (!(await hasUnsyncedOperationsForProduct(productId))) {
        await setCartItemSyncStatus(productId, 'synced');
      }
    });
    notify();
  }

  return false;
}

async function sendOperation(operation) {
  if (operation.type !== OPERATION_TYPES.ADD_TO_CART) {
    throw new Error(`Tipo de operação desconhecido: ${operation.type}`);
  }

  const { userId, productId, quantity } = JSON.parse(operation.payload);

  // Mesmo formato do corpo de exemplo do desafio
  return request('/carts/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, products: [{ id: productId, quantity }] }),
  });
}