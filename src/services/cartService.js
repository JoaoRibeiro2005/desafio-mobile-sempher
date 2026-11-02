import * as Crypto from 'expo-crypto';
import { runInTransaction } from '../database/db';
import {
  getCartItems,
  addToCart,
  setCartQuantity,
  removeFromCart,
} from '../database/cartRepository';
import {
  OPERATION_TYPES,
  createPendingOperation,
  countUnsyncedOperations,
  countFailedOperations,
  discardPendingAddOperations,
} from '../database/pendingOperationsRepository';

const USER_ID = 1; // o app não tem login: o carrinho é sempre do usuário 1

// Lê o carrinho, as operações aguardando sincronização e as que falharam
export async function loadCart() {
  const [items, pendingCount, failedCount] = await Promise.all([
    getCartItems(),
    countUnsyncedOperations(),
    countFailedOperations(),
  ]);
  return { items, pendingCount, failedCount };
}

// O item no carrinho e a operação pendente são gravados juntos: ou os dois, ou nenhum
export function addProductToCart(product) {
  return runInTransaction(async () => {
    await addToCart(product, 1);
    await createPendingOperation({
      uuid: Crypto.randomUUID(),
      type: OPERATION_TYPES.ADD_TO_CART,
      payload: { userId: USER_ID, productId: product.id, quantity: 1 },
    });
  });
}

// Alterar a quantidade é uma ação só local: não cria operação
export function changeCartQuantity(productId, quantity) {
  return setCartQuantity(productId, quantity);
}

// Ao remover, as operações desse produto que ainda não foram enviadas são descartadas
export function removeProductFromCart(productId) {
  return runInTransaction(async () => {
    await removeFromCart(productId);
    await discardPendingAddOperations(productId);
  });
}