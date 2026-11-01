import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Button,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { getCachedProduct, fetchProduct } from '../services/productsService';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatPrice';

export default function ProductDetailScreen({ route }) {
  // O id chega pela navegação (navigation.navigate('ProductDetail', { productId }))
  const { productId } = route.params;

  const { items, addItem, error: cartError } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false); // API falhou, mostrando dados salvos
  const [attempt, setAttempt] = useState(0); // muda para tentar de novo

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
        <Text style={styles.notice}>Não foi possível atualizar. Exibindo dados salvos.</Text>
      )}
      <Image source={{ uri: product.thumbnail }} style={styles.image} resizeMode="contain" />
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
  notice: { backgroundColor: '#fff8e1', color: '#8a6d00', padding: 8, textAlign: 'center' },
  image: { width: '100%', height: 280, backgroundColor: '#f2f2f2' },
  content: { padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: 'bold' },
  price: { fontSize: 20, color: '#2e7d32', fontWeight: '600' },
  category: { fontSize: 14, color: '#666', textTransform: 'capitalize' },
  description: { fontSize: 16, lineHeight: 22, marginTop: 8 },
  inCart: { textAlign: 'center', color: '#2e7d32', fontWeight: '600' },
  cartError: { textAlign: 'center', color: '#b71c1c' },
});