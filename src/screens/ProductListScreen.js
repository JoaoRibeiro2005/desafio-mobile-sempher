import { View, Text, Button, StyleSheet } from 'react-native';

export default function ProductListScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de produtos</Text>

      {/* Botões temporários só para testar a navegação */}
      <Button
        title="Ver detalhes (produto 1)"
        onPress={() => navigation.navigate('ProductDetail', { productId: 1 })}
      />
      <Button title="Ir para o carrinho" onPress={() => navigation.navigate('Cart')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 20, fontWeight: 'bold' },
});