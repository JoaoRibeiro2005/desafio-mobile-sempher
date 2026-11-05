import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, Button, ActivityIndicator, StyleSheet } from 'react-native';
import ProductCard from '../components/ProductCard';
import StatusBanner from '../components/StatusBanner';
import { getProducts, PAGE_SIZE } from '../services/productsService';
import { useConnectivity } from '../context/ConnectivityContext';

export default function ProductListScreen({ navigation }) {
  const { isOnline } = useConnectivity();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); // primeira carga
  const [loadingMore, setLoadingMore] = useState(false); // próxima página
  const [refreshing, setRefreshing] = useState(false); // puxar para atualizar
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false); // dados vindos do SQLite
  const [imageReloadKey, setImageReloadKey] = useState(0); // força imagens a recarregar
  const isFetching = useRef(false); // evita duas buscas ao mesmo tempo
  const listRef = useRef(null); // acesso à FlatList, para voltar ao topo
  const wasOnline = useRef(isOnline); // estado da conexão na última verificação

  const loadProducts = useCallback(
    async (reset = false) => {
      if (isFetching.current) return;
      isFetching.current = true;

      const skip = reset ? 0 : products.length;
      try {
        const data = await getProducts({ limit: PAGE_SIZE, skip });
        setProducts((prev) => (reset ? data.products : [...prev, ...data.products]));
        setTotal(data.total);
        setFromCache(data.fromCache);
        setError(null);

        if (reset) {
          // A lista foi trocada: volta ao topo
          listRef.current?.scrollToOffset({ offset: 0, animated: false });
          // Dados novos da API: as imagens que falharam offline tentam de novo
          if (!data.fromCache) setImageReloadKey((key) => key + 1);
        }
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

  // Quando a conexão volta, tenta de novo sozinha (o toque nos avisos continua valendo)
  useEffect(() => {
    const reconnected = isOnline && !wasOnline.current;
    wasOnline.current = isOnline;
    if (!reconnected) return;

    if (products.length === 0) {
      // Estava na tela de erro: recarrega do zero, com o spinner
      setLoading(true);
      loadProducts(true);
    } else if (fromCache) {
      // Mostrava dados salvos: troca pelos dados da API
      loadProducts(true);
    } else if (error) {
      // Falhou ao carregar mais: continua de onde parou
      loadProducts();
    }
  }, [isOnline, products.length, fromCache, error, loadProducts]);

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

  // Falhou, e não há nada na API nem salvo no SQLite
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
      {error && (
        <StatusBanner
          type="error"
          text={`${error} Toque para tentar novamente.`}
          onPress={() => loadProducts()}
        />
      )}
      {!error && fromCache && (
        <StatusBanner
          type="warning"
          text="Não foi possível atualizar. Exibindo dados salvos. Toque para tentar novamente."
          onPress={() => loadProducts(true)}
        />
      )}
      <FlatList
        ref={listRef}
        data={products}
        extraData={imageReloadKey}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            reloadKey={imageReloadKey}
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
  footer: { marginVertical: 16 },
});