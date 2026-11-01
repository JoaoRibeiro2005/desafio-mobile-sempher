import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatPrice';

export default function CartScreen() {
  const { items, total, loading, error, changeQuantity, removeItem } = useCart();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.banner}>{error}</Text>}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.product_id)}
        renderItem={({ item }) => (
          <CartItem
            item={item}
            onIncrease={() => changeQuantity(item.product_id, item.quantity + 1)}
            onDecrease={() => changeQuantity(item.product_id, item.quantity - 1)}
            onRemove={() => removeItem(item.product_id)}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Seu carrinho está vazio.</Text>}
      />
      {items.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: { backgroundColor: '#fdecea', color: '#b71c1c', padding: 8, textAlign: 'center' },
  empty: { textAlign: 'center', marginTop: 48, fontSize: 16, color: '#666' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: { fontSize: 18, fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32' },
});