# Testes manuais

Testes feitos no iPhone, com o app aberto pelo Expo Go (servidor iniciado com `npx expo start`).
Cada linha deve ser preenchida só depois de executar o teste.

## Etapa 2: listagem de produtos

| Cenário | Como testei | Resultado esperado | Resultado |
| --- | --- | --- | --- |
| Carga inicial | Abrir o app com internet | Spinner e depois a lista com imagem, nome e preço | OK |
| Paginação | Rolar até o fim da lista | Carrega mais 20 produtos | OK |
| Puxar para atualizar | Puxar a lista para baixo | Volta à primeira página, sem duplicar itens | OK |
| Sem internet ao abrir (falha simulada no código) | Primeira requisição forçada a falhar | Mensagem de erro e botão "Tentar novamente" | OK |
| Tentar novamente | Tocar no botão após a falha simulada | A lista carrega | OK |
| Erro do servidor | Trocar `/products` por `/produtos` | "Erro do servidor (404)" | OK |
| Tempo esgotado | `TIMEOUT_MS = 1` | Mensagem de conexão | OK |
| Perda de rede durante a paginação | Abrir com internet, ligar o modo avião e rolar até o fim | Banner de erro no topo | OK |
| Reconexão | Desligar o modo avião depois do erro | Idealmente, a lista recarregar sozinha | Não recarregou sozinha. Foi preciso rolar a lista de novo e puxar para atualizar. Ver "Limitações conhecidas" |
| Banner tocável | Tocar no banner de erro após reconectar | Carrega a próxima página e o banner some | OK |
| Falha forçada durante a paginação | Salvei o api.js com a lista já carregada e mexi na lista | Aviso de erro sem apagar a lista| OK. O aviso apareceu com a lista mantida e sumiu na rolagem seguinte, quando a requisição passou |

## Limitações conhecidas

- **Sem recarga automática ao reconectar.** A tela só tenta de novo quando o usuário rola até o fim, puxa para atualizar ou toca no banner. A causa é que o app ainda não detecta mudanças de conectividade: o `onEndReached` só dispara ao chegar perto do fim da lista, e o banner só some quando uma requisição dá certo. Será resolvido com `@react-native-community/netinfo` na etapa de sincronização.
- **Mitigação atual:** o banner de erro é tocável e tenta carregar a próxima página.
