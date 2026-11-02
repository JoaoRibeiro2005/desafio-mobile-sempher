import { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

const ConnectivityContext = createContext(null);

export function ConnectivityProvider({ children }) {
  // Começa como "online" até o NetInfo informar o estado real
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    function update(state) {
      // isConnected e isInternetReachable podem vir null (desconhecido):
      // só consideramos offline quando for explicitamente false
      setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
    }

    NetInfo.fetch().then(update); // estado atual, uma vez
    const unsubscribe = NetInfo.addEventListener(update); // e a cada mudança
    return unsubscribe; // ao desmontar, para de ouvir
  }, []);

  return <ConnectivityContext.Provider value={{ isOnline }}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity() {
  const context = useContext(ConnectivityContext);
  if (!context) {
    throw new Error('useConnectivity deve ser usado dentro de um ConnectivityProvider');
  }
  return context;
}