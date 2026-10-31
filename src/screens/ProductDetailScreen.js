import { View, Text, StyleSheet } from 'react-native';

export default function ProductDetailScreen({ route }) {
  // O id chega pela navegação (navigation.navigate('ProductDetail', { productId }))
  const { productId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes do produto {productId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
});