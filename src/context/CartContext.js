import { createContext, useContext, useEffect, useState } from 'react';
import { useConnectivity } from './ConnectivityContext';
import {
  loadCart,
  addProductToCart,
  changeCartQuantity,
  removeProductFromCart,
} from '../services/cartService';
import {
  syncPendingOperations,
  retryFailedOperations,
  recoverInterruptedOperations,
  onSyncProgress,
} from '../services/syncService';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isOnline } = useConnectivity();
  const [items, setItems] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false); // o carrinho já foi carregado do SQLite
  const [error, setError] = useState(null);

  // Lê o carrinho e os contadores do SQLite e atualiza a tela
  async function refresh() {
    const cart = await loadCart();
    setItems(cart.items);
    setPendingCount(cart.pendingCount);
    setFailedCount(cart.failedCount);
  }

  // Executa uma ação e recarrega o carrinho para refletir o resultado
  async function run(action) {
    try {
      await action();
      await refresh();
      setError(null);
      return true;
    } catch (e) {
      console.warn('Erro no carrinho:', e);
      setError('Não foi possível atualizar o carrinho. Tente novamente.');
      return false;
    }
  }

  // Ao abrir o app: recupera operações interrompidas e carrega o carrinho salvo
  useEffect(() => {
    async function start() {
      try {
        await recoverInterruptedOperations();
        await refresh();
      } catch (e) {
        console.warn('Erro ao carregar o carrinho:', e);
        setError('Não foi possível carregar o carrinho.');
      }
      setLoading(false);
      setReady(true);
    }
    start();
  }, []);

  // Ao abrir o app e sempre que a conexão voltar, tenta enviar as pendentes
  useEffect(() => {
    if (ready && isOnline) {
      syncPendingOperations();
    }
  }, [ready, isOnline]);

  // Quando a sincronização muda algo, a tela se atualiza
  useEffect(() => {
    return onSyncProgress(() => {
      refresh().catch((e) => console.warn('Erro ao atualizar o carrinho:', e));
    });
  }, []);

  // Valores derivados: calculados a partir dos itens, sem estado próprio
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  // Soma em centavos para evitar erros de arredondamento com decimais
  const total =
    items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;

  const value = {
    items,
    pendingCount,
    failedCount,
    loading,
    error,
    itemCount,
    total,
    addItem: async (product) => {
      const ok = await run(() => addProductToCart(product));
      if (ok) syncPendingOperations(); // sem await: a tela não espera a rede
      return ok;
    },
    changeQuantity: (productId, quantity) => run(() => changeCartQuantity(productId, quantity)),
    removeItem: (productId) => run(() => removeProductFromCart(productId)),
    syncNow: () => syncPendingOperations(),
    retryFailed: () => run(() => retryFailedOperations()),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}