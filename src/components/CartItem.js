import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { formatPrice } from '../utils/formatPrice';

export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  const canDecrease = item.quantity > 1;
  const synced = item.sync_status === 'synced';

  return (
    <View style={styles.card}>
      {/* Imagem em cache de disco: continua aparecendo no modo avião */}
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
        <Text style={synced ? styles.synced : styles.waiting}>
          {synced ? 'Sincronizado' : 'Aguardando sincronização'}
        </Text>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.qtyButton, !canDecrease && styles.qtyButtonDisabled]}
            onPress={onDecrease}
            disabled={!canDecrease}
          >
            <Text style={styles.qtyText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qtyButton} onPress={onIncrease}>
            <Text style={styles.qtyText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove}>
            <Text style={styles.remove}>Remover</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.subtotal}>{formatPrice(item.price * item.quantity)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 8,
  },
  image: { width: 64, height: 64, borderRadius: 6, backgroundColor: '#eee' },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: '600' },
  price: { fontSize: 13, color: '#666', marginTop: 2 },
  waiting: { fontSize: 12, color: '#8a6d00', marginTop: 2 },
  synced: { fontSize: 12, color: '#2e7d32', marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonDisabled: { opacity: 0.4 },
  qtyText: { fontSize: 18, color: '#1a56db' },
  quantity: { fontSize: 16, minWidth: 20, textAlign: 'center' },
  remove: { fontSize: 13, color: '#b71c1c' },
  subtotal: { fontSize: 15, fontWeight: '600', color: '#2e7d32', marginLeft: 8 },
});