import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Button, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import StatusBanner from '../components/StatusBanner';
import { getCachedProduct, fetchProduct } from '../services/productsService';
import { useCart } from '../context/CartContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { formatPrice } from '../utils/formatPrice';

export default function ProductDetailScreen({ route }) {
  // O id chega pela navegação (navigation.navigate('ProductDetail', { productId }))
  const { productId } = route.params;

  const { items, addItem, error: cartError } = useCart();
  const { isOnline } = useConnectivity();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false); // API falhou, mostrando dados salvos
  const [attempt, setAttempt] = useState(0); // muda para buscar de novo
  const wasOnline = useRef(isOnline); // estado da conexão na última verificação

  // Quantas unidades deste produto já estão no carrinho
  const quantityInCart = items.find((item) => item.product_id === productId)?.quantity ?? 0;

  useEffect(() => {
    let active = true; // vira false se o usuário sair da tela antes da resposta

    async function load() {
      // 1. Mostra na hora o que já está salvo, se houver
      const cached = await getCachedProduct(productId);
      if (!active) return;
      if (cached) {
        setProduct(cached);
        setLoading(false);
      }

      // 2. Tenta atualizar com a API
      try {
        const fresh = await fetchProduct(productId);
        if (!active) return;
        setProduct(fresh);
        setFromCache(false);
        setError(null);
      } catch (err) {
        if (!active) return;
        if (cached) {
          setFromCache(true); // mantém o que está salvo e avisa
        } else {
          setError(err.message); // não há nada para mostrar
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [productId, attempt]);

  // Quando a conexão volta e a tela mostra dados salvos, busca de novo sozinha
  useEffect(() => {
    if (isOnline && !wasOnline.current && fromCache) {
      setAttempt((value) => value + 1);
    }
    wasOnline.current = isOnline;
  }, [isOnline, fromCache]);

  // Tentar de novo sem esconder o produto que já está na tela
  function handleRefresh() {
    setAttempt((value) => value + 1);
  }

  // Tentar de novo a partir da tela de erro
  function handleRetry() {
    setError(null);
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Produto não encontrado.'}</Text>
        <Button title="Tentar novamente" onPress={handleRetry} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {fromCache && (
        <StatusBanner
          type="warning"
          text="Não foi possível atualizar. Exibindo dados salvos. Toque para tentar novamente."
          onPress={handleRefresh}
        />
      )}
      {/* A key com o attempt recria a imagem, para ela tentar baixar de novo após reconectar */}
      <Image
        key={`${product.thumbnail}-${attempt}`}
        source={{ uri: product.thumbnail }}
        style={styles.image}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
      <View style={styles.content}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        {product.category ? <Text style={styles.category}>{product.category}</Text> : null}
        {product.description ? (
          <Text style={styles.description}>{product.description}</Text>
        ) : null}

        <Button title="Adicionar ao carrinho" onPress={() => addItem(product)} />
        {quantityInCart > 0 && <Text style={styles.inCart}>No carrinho: {quantityInCart}</Text>}
        {cartError && <Text style={styles.cartError}>{cartError}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 16, textAlign: 'center' },
  image: { width: '100%', height: 280, backgroundColor: '#f2f2f2' },
  content: { padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: 'bold' },
  price: { fontSize: 20, color: '#2e7d32', fontWeight: '600' },
  category: { fontSize: 14, color: '#666', textTransform: 'capitalize' },
  description: { fontSize: 16, lineHeight: 22, marginTop: 8 },
  inCart: { textAlign: 'center', color: '#2e7d32', fontWeight: '600' },
  cartError: { textAlign: 'center', color: '#b71c1c' },
});