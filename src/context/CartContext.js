import { createContext, useContext, useEffect, useState } from 'react';
import {
  getCartItems,
  addToCart,
  setCartQuantity,
  removeFromCart,
} from '../database/cartRepository';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Executa uma ação no banco e recarrega o carrinho para refletir o resultado
  async function run(action) {
    try {
      await action();
      setItems(await getCartItems());
      setError(null);
      return true;
    } catch (e) {
      console.warn('Erro no carrinho:', e);
      setError('Não foi possível atualizar o carrinho. Tente novamente.');
      return false;
    }
  }

  // Ao abrir o app, carrega o carrinho salvo
  useEffect(() => {
    run(async () => {}).finally(() => setLoading(false));
  }, []);

  // Valores derivados: calculados a partir dos itens, sem estado próprio
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  // Soma em centavos para evitar erros de arredondamento com decimais
  const total = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;

  const value = {
    items,
    loading,
    error,
    itemCount,
    total,
    addItem: (product) => run(() => addToCart(product)),
    changeQuantity: (productId, quantity) => run(() => setCartQuantity(productId, quantity)),
    removeItem: (productId) => run(() => removeFromCart(productId)),
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