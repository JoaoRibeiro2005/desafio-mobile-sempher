import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, Button, ActivityIndicator, StyleSheet } from 'react-native';
import ProductCard from '../components/ProductCard';
import { getProducts, PAGE_SIZE } from '../services/productsService';

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); // primeira carga
  const [loadingMore, setLoadingMore] = useState(false); // próxima página
  const [refreshing, setRefreshing] = useState(false); // puxar para atualizar
  const [error, setError] = useState(null);
  const isFetching = useRef(false); // evita duas buscas ao mesmo tempo

  const loadProducts = useCallback(
    async (reset = false) => {
      if (isFetching.current) return;
      isFetching.current = true;

      const skip = reset ? 0 : products.length;
      try {
        const data = await getProducts({ limit: PAGE_SIZE, skip });
        setProducts((prev) => (reset ? data.products : [...prev, ...data.products]));
        setTotal(data.total);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        isFetching.current = false;
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [products.length]
  );

  // Roda uma vez, quando a tela abre
  useEffect(() => {
    loadProducts(true);
  }, []);

  function handleEndReached() {
    // Só pede mais se ainda há produtos e nada está carregando
    if (isFetching.current || products.length >= total) return;
    setLoadingMore(true);
    loadProducts();
  }

  function handleRefresh() {
    setRefreshing(true);
    loadProducts(true);
  }

  function handleRetry() {
    setLoading(true);
    loadProducts(true);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Falhou e não há nada para mostrar
  if (error && products.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar novamente" onPress={handleRetry} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.banner}>{error}</Text>}
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          />
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 16, textAlign: 'center' },
  banner: { backgroundColor: '#fdecea', color: '#b71c1c', padding: 8, textAlign: 'center' },
  footer: { marginVertical: 16 },
});