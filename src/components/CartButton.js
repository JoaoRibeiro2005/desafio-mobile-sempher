import { Button } from 'react-native';
import { useCart } from '../context/CartContext';

// Botão do cabeçalho, com a quantidade de itens no carrinho
export default function CartButton({ onPress }) {
  const { itemCount } = useCart();
  const title = itemCount > 0 ? `Carrinho (${itemCount})` : 'Carrinho';

  return <Button title={title} onPress={onPress} />;
}