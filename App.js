import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ConnectivityProvider } from './src/context/ConnectivityContext';
import { CartProvider } from './src/context/CartContext';
import CartButton from './src/components/CartButton';
import ProductListScreen from './src/screens/ProductListScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ConnectivityProvider>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="ProductList">
            <Stack.Screen
              name="ProductList"
              component={ProductListScreen}
              options={({ navigation }) => ({
                title: 'Produtos',
                headerRight: () => <CartButton onPress={() => navigation.navigate('Cart')} />,
              })}
            />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={({ navigation }) => ({
                title: 'Detalhes',
                headerRight: () => <CartButton onPress={() => navigation.navigate('Cart')} />,
              })}
            />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Carrinho' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </ConnectivityProvider>
  );
}