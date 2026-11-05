import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { formatPrice } from '../utils/formatPrice';

export default function ProductCard({ product, onPress, reloadKey = 0 }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* cachePolicy guarda a imagem em disco: aparece offline se já carregou antes */}
      {/* Quando o reloadKey muda, a imagem é recriada e tenta baixar de novo */}
      <Image
        key={reloadKey}
        source={{ uri: product.thumbnail }}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
      </View>
    </TouchableOpacity>
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
  image: { width: 72, height: 72, borderRadius: 6, backgroundColor: '#eee' },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 15, color: '#2e7d32', marginTop: 4 },
});