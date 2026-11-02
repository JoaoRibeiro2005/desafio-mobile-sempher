import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import CartItem from '../components/CartItem';
import StatusBanner from '../components/StatusBanner';
import { useCart } from '../context/CartContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { formatPrice } from '../utils/formatPrice';

export default function CartScreen() {
  const {
    items,
    total,
    pendingCount,
    failedCount,
    loading,
    error,
    changeQuantity,
    removeItem,
    syncNow,
    retryFailed,
  } = useCart();
  const { isOnline } = useConnectivity();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const pendingText =
    pendingCount === 1
      ? '1 operação aguardando sincronização'
      : `${pendingCount} operações aguardando sincronização`;

  const failedText =
    failedCount === 1
      ? '1 operação não pôde ser enviada. Toque para tentar novamente.'
      : `${failedCount} operações não puderam ser enviadas. Toque para tentar novamente.`;

  return (
    <View style={styles.container}>
      {error && <StatusBanner type="error" text={error} />}
      {failedCount > 0 && <StatusBanner type="error" text={failedText} onPress={retryFailed} />}
      {pendingCount > 0 && (
        <StatusBanner
          type="warning"
          text={`${pendingText}${isOnline ? '. Toque para sincronizar.' : '. Sem conexão.'}`}
          onPress={syncNow}
        />
      )}
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