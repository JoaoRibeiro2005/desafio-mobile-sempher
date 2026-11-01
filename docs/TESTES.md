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
| Erro do servidor | Trocar `/products` por `/produtos` | "Erro do servidor (404)" | OK. A partir da etapa 3, com cache salvo, esse erro cai nos dados salvos. |
| Tempo esgotado | `TIMEOUT_MS = 1` | Mensagem de conexão | OK |
| Perda de rede durante a paginação | Abrir com internet, ligar o modo avião e rolar até o fim | Banner de erro no topo | OK |
| Reconexão | Desligar o modo avião depois do erro | Idealmente, a lista recarregar sozinha | Não recarregou sozinha. Foi preciso rolar a lista de novo e puxar para atualizar. Ver "Limitações conhecidas" |
| Banner tocável | Tocar no banner de erro após reconectar | Carrega a próxima página e o banner some | OK |
| Falha forçada durante a paginação | Salvei o api.js com a lista já carregada e mexi na lista | Aviso de erro sem apagar a lista| OK. O aviso apareceu com a lista mantida e sumiu na rolagem seguinte, quando a requisição passou |

## Etapa 3: SQLite e cache de produtos

| Cenário | Como testei | Resultado esperado | Resultado |
| --- | --- | --- | --- |
| Cache sendo salvo | Abrir com internet e rolar 2 ou 3 páginas | Lista normal, sem aviso amarelo | OK |
| Abrir sem internet, com cache | Falha simulada na primeira requisição (`firstCall` no `api.js`) e `r` | Lista com os produtos salvos e aviso amarelo | OK |
| Persistência ao fechar o app | Com a falha simulada ativa, fechar o Expo Go por completo e abrir de novo | A lista salva continua aparecendo | OK |
| Puxar para atualizar offline | Abrir com internet, ligar o modo avião e puxar a lista | Aviso amarelo com os produtos salvos | OK |
| Voltar a conexão | Desligar o modo avião e tocar no aviso amarelo | Lista recarrega da API e o aviso some | OK |
| Paginação offline | Com mais de 20 produtos salvos, abrir offline e rolar | Carrega as próximas páginas do cache e para no fim dos itens salvos | OK |
| Sem internet e sem cache | Falha simulada com a tabela vazia (`DROP TABLE` temporário no `db.js`) | Tela de erro com "Sem conexão e nenhum dado salvo..." e botão | OK |
| Perda de rede além do cache | Abrir com internet, ligar o modo avião e rolar até o fim | Banner vermelho de erro, como na etapa 2 | OK |
| Erro do servidor com cache | Trocar `/products` por `/produtos` | Lista salva com aviso amarelo, em vez do erro 404 | OK |
| Imagens offline | Observar a lista nos testes de abrir offline e puxar para atualizar | Só registrar: podem aparecer ou ficar em branco | OK. Somente algumas imagens iniciais aparecem |

## Etapa 4: tela de detalhes

| Cenário | Como testei | Resultado esperado | Resultado |
| --- | --- | --- | --- |
| Detalhes online | Tocar num produto com internet | Imagem, nome, preço, categoria e descrição | OK |
| Detalhes offline, com dados salvos | Modo avião e tocar num produto | Abre na hora com aviso amarelo | OK |
| Detalhes ao reconectar | Desligar o modo avião e abrir o produto de novo | Sem aviso amarelo | OK |
| Produto inexistente, sem cache | `productId: 9999` temporário na lista | "Erro do servidor (404)." e botão "Tentar novamente" | OK |
| Voltar rápido da tela | Abrir e voltar várias vezes seguidas | Sem avisos do React no terminal | OK |

## Etapa 5: carrinho local

| Cenário | Como testei | Resultado esperado | Resultado |
| --- | --- | --- | --- |
| Adicionar ao carrinho | Tocar em "Adicionar ao carrinho" nos detalhes | Contador do cabeçalho sobe e aparece "No carrinho: 1" | OK |
| Mesmo produto de novo | Adicionar o mesmo produto 3 vezes | Uma linha com quantidade 3 | OK |
| Produtos diferentes | Adicionar 3 produtos distintos | 3 linhas, na ordem de inclusão | OK |
| Total | Conferir com calculadora | Soma de preço vezes quantidade | OK |
| Mais e menos | Usar os botões de quantidade | "−" desabilitado em 1; subtotal e total atualizam | OK |
| Remover | Remover itens até esvaziar | Total atualiza e aparece "Seu carrinho está vazio." | OK |
| Toques rápidos | Tocar no "+" 10 vezes seguidas | Quantidade final igual ao número de toques | OK |
| Persistência | Fechar o Expo Go por completo e reabrir | O carrinho continua com os mesmos itens | OK |
| Carrinho offline | Modo avião e adicionar um produto | Funciona normalmente | OK |

## Limitações conhecidas

- **Sem recarga automática ao reconectar.** A tela só tenta de novo quando o usuário rola até o fim, puxa para atualizar ou toca no banner. A causa é que o app ainda não detecta mudanças de conectividade: o `onEndReached` só dispara ao chegar perto do fim da lista, e o banner só some quando uma requisição dá certo. Será resolvido com `@react-native-community/netinfo` na etapa de sincronização.
- **Mitigação atual:** o banner de erro é tocável e tenta carregar a próxima página.
