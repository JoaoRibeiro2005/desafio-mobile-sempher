import { Text, TouchableOpacity, StyleSheet } from 'react-native';

const COLORS = {
  warning: { backgroundColor: '#fff8e1', color: '#8a6d00' },
  error: { backgroundColor: '#fdecea', color: '#b71c1c' },
};

// Faixa de aviso no topo da tela. Se receber onPress, vira um botão
export default function StatusBanner({ type = 'warning', text, onPress }) {
  const content = <Text style={[styles.text, COLORS[type]]}>{text}</Text>;

  if (!onPress) return content;
  return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
}

const styles = StyleSheet.create({
  text: { padding: 8, textAlign: 'center' },
});