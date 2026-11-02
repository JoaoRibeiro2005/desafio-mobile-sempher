# Planejamento do projeto

Documento de planejamento do desafio técnico mobile da Sempher Solutions: um app de produtos e carrinho que funciona online e offline, com SQLite local e sincronização com uma API REST.

Escrevi isto antes de começar a programar para ter um mapa do que preciso fazer. Parte do texto deve virar a documentação do README no final (tabelas e sincronização).

## 1. O que precisa ser entregue

- Listagem de produtos com nome, imagem e preço, vindos da API.
- Tela de detalhes do produto.
- Produtos consultados ficam salvos no SQLite e aparecem quando não há internet.
- Carrinho: adicionar, alterar quantidade, remover, ver o total.
- Carrinho salvo no SQLite e mantido depois de fechar o app.
- Online: a inclusão no carrinho é enviada para a API (`POST /carts/add`).
- Offline: a operação fica guardada no SQLite como pendente e o usuário continua usando o app.
- Ao reconectar: enviar as pendentes, atualizar o status de cada uma e nunca enviar duas vezes a mesma operação.
- Mensagens de erro adequadas, sem perder operações, e aviso de que existem operações aguardando sincronização.

## 2. Tecnologias e bibliotecas

| Item | Escolha | Motivo |
| --- | --- | --- |
| Framework | React Native com Expo | Mais simples de configurar e testar no celular com o Expo Go |
| Linguagem | JavaScript | Exigido pelo desafio |
| SQLite | `expo-sqlite` | Biblioteca oficial do Expo, funciona direto no Expo Go |
| Conectividade | `@react-native-community/netinfo` | Detecta quando fica online/offline e avisa na mudança |
| HTTP | `fetch` nativo | Não precisa de biblioteca extra para esse volume de requisições |
| Navegação | React Navigation (stack) | Padrão do ecossistema, três telas simples |
| Estado | Context API | Suficiente para o tamanho do app, sem Redux |
| API | DummyJSON | Sugerida no desafio |

## 3. Estrutura de pastas

```
src/
  database/        # tudo que fala com o SQLite
    db.js                          # abre o banco e cria as tabelas
    productsRepository.js
    cartRepository.js
    pendingOperationsRepository.js
  services/        # tudo que fala com a API e regras de negócio
    api.js                         # fetch com tratamento de erro e timeout
    productsService.js             # API primeiro, SQLite como fallback
    cartService.js                 # regras do carrinho
    syncService.js                 # envio das operações pendentes
  context/
    ConnectivityContext.js         # estado online/offline
    CartContext.js                 # carrinho e contador de pendentes
  screens/
    ProductListScreen.js
    ProductDetailScreen.js
    CartScreen.js
  components/
    ProductCard.js
    CartItem.js
    StatusBanner.js                # "Sem conexão" e "N operações pendentes"
  utils/
    formatPrice.js
App.js             # providers e navegação
```

Ideia principal: as telas não falam direto com o banco nem com a API. Elas chamam os serviços, e os serviços usam os repositórios. Assim cada arquivo tem uma responsabilidade só.

## 4. Banco de dados (SQLite)

### `products` (cache dos produtos)

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | INTEGER | Chave primária, mesmo id da API |
| `title` | TEXT | Nome do produto |
| `description` | TEXT | |
| `price` | REAL | |
| `thumbnail` | TEXT | URL da imagem |
| `category` | TEXT | |
| `updated_at` | TEXT | Quando foi salvo/atualizado localmente |

Salvo com "inserir ou substituir" (upsert), então consultar de novo atualiza o cache sem duplicar.

### `cart_items` (carrinho local)

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `product_id` | INTEGER | Chave primária (um item por produto) |
| `title` | TEXT | Cópia do nome no momento da adição |
| `price` | REAL | Cópia do preço |
| `thumbnail` | TEXT | Cópia da imagem |
| `quantity` | INTEGER | Quantidade atual |
| `sync_status` | TEXT | `pending` ou `synced` |
| `updated_at` | TEXT | |

Guardo uma cópia dos dados do produto no carrinho de propósito: assim o carrinho continua completo mesmo que o produto não esteja no cache.

### `pending_operations` (fila de sincronização)

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | INTEGER | Chave primária autoincrementada, define a ordem |
| `operation_uuid` | TEXT | Identificador único da operação (UNIQUE) |
| `type` | TEXT | Por enquanto só `ADD_TO_CART` |
| `payload` | TEXT | JSON com `userId`, `productId` e `quantity` |
| `status` | TEXT | `pending`, `syncing`, `synced` ou `failed` |
| `attempts` | INTEGER | Quantas tentativas de envio já foram feitas |
| `last_error` | TEXT | Mensagem do último erro, se houver |
| `created_at` | TEXT | |
| `synced_at` | TEXT | Preenchido quando a API confirma |

O `operation_uuid` é a base da prevenção de duplicidade: cada operação nasce com um identificador próprio e só existe uma linha por ele.

## 5. Fluxo de sincronização

### Adicionar ao carrinho (sempre o mesmo caminho)

1. Em uma única transação, gravar o item em `cart_items` (`sync_status = pending`) e criar a linha em `pending_operations` (`status = pending`).
2. A tela atualiza na hora, porque o dado local já está salvo.
3. Chamar o `syncService`. Se estiver online, ele envia a operação; se não, não faz nada e ela espera.

Fazer sempre "grava local, depois tenta enviar" evita ter dois caminhos diferentes (online e offline) e reduz bugs. O usuário nunca espera a rede para ver o carrinho atualizado.

### Processar a fila (`syncService`)

1. Se já houver uma sincronização rodando, sair (trava com uma flag para não rodar duas ao mesmo tempo).
2. Buscar as operações com `status = pending`, da mais antiga para a mais nova.
3. Para cada uma:
   - marcar `syncing` e somar 1 em `attempts`;
   - chamar `POST /carts/add` com o payload;
   - **sucesso:** marcar `synced`, preencher `synced_at` e atualizar o `sync_status` do item do carrinho;
   - **falha de rede ou erro do servidor:** voltar para `pending`, salvar `last_error` e parar o processamento (se a rede caiu, as próximas também vão falhar);
   - **falha repetida** (por exemplo 5 tentativas): marcar `failed` para não ficar tentando para sempre, e avisar o usuário.
4. Ao terminar, atualizar o contador de pendentes na interface.

### Quando a sincronização dispara

- Quando o NetInfo avisa que voltou a conexão.
- Quando o app abre.
- Logo depois de cada adição ao carrinho.

### Casos que precisam de cuidado

- **App fechado no meio do envio:** uma operação pode ficar presa em `syncing`. Ao abrir o app, todas as `syncing` voltam para `pending`.
- **Envio duplicado:** só operações `pending` são enviadas, e `synced` nunca volta para `pending`. Como a DummyJSON só simula as escritas, o `operation_uuid` não é enviado a ela, mas fica como controle local.
- **Remover item com operação ainda pendente:** as operações pendentes daquele produto são descartadas, porque o usuário desistiu dele.

### Decisão sobre alterar quantidade e remover

O desafio só pede o envio da **inclusão** ao carrinho. Alterar quantidade e remover ficam apenas locais (SQLite). Se sobrar tempo, dá para evoluir criando outros tipos de operação na mesma fila.

## 6. Produtos online e offline

1. Ao abrir a lista, tentar `GET /products` (com paginação por `limit` e `skip`).
2. Se deu certo, salvar/atualizar os produtos no SQLite e mostrar a resposta da API.
3. Se falhou (sem rede ou erro), ler da tabela `products` e mostrar um aviso de que os dados são locais.
4. Se não há internet **e** o cache está vazio, mostrar uma mensagem clara explicando que é preciso conectar ao menos uma vez.
5. Na tela de detalhes: mostrar primeiro o que está no cache, tentar `GET /products/{id}` e atualizar se funcionar.

O `userId` usado no carrinho será fixo (`1`), já que o app não tem login.

## 7. Tratamento de erros

| Situação | O que o usuário vê | O que acontece por trás |
| --- | --- | --- |
| Sem internet ao abrir a lista | Aviso "Sem conexão, exibindo dados salvos" | Lê do SQLite |
| Sem internet e sem cache | Mensagem pedindo para conectar | Nada a exibir |
| Erro da API ao listar | Mensagem de erro com botão "Tentar novamente" | Usa o cache se existir |
| Adicionar ao carrinho offline | Item entra normalmente, com indicação de pendente | Operação guardada em `pending_operations` |
| Falha na sincronização | Aviso de que há operações aguardando | Operação volta para `pending` com `last_error` |
| Operações pendentes | Contador visível ("2 operações aguardando sincronização") | Consulta à tabela de pendentes |

## 8. Ordem de implementação (commits)

Cada etapa deve virar um ou poucos commits pequenos, no formato `tipo: descrição`:

1. Estrutura de pastas e navegação básica.
2. Consumo da API de produtos e tela de listagem.
3. Banco SQLite e cache de produtos (lista funcionando offline).
4. Tela de detalhes.
5. Carrinho local (adicionar, alterar quantidade, remover, total).
6. Fila de operações pendentes.
7. Detecção de conectividade e sincronização ao reconectar.
8. Tratamento de erros e avisos na interface.
9. README completo e capturas de tela ou vídeo.

## 9. Pontos para eu conseguir explicar depois

- Por que gravar no banco local antes de chamar a API.
- Como o `operation_uuid` e os status evitam envio duplicado.
- O que acontece se o app fechar no meio de uma sincronização.
- Por que o carrinho guarda uma cópia dos dados do produto.
- Por que Context API em vez de Redux neste tamanho de projeto.

## 10. Ajustes feitos durante a implementação

- **Tabelas criadas por etapa:** o `db.js` cria só as tabelas que a etapa atual usa. A `products` veio na etapa 3; `cart_items` e `pending_operations` entram nas etapas do carrinho e da fila.
- **Banners tocáveis:** o banner de erro e o aviso de dados salvos são tocáveis para tentar de novo. É uma mitigação, enquanto o app não detecta a volta da conexão (NetInfo).
- **Aviso de dados salvos:** o serviço de produtos devolve `fromCache` e a tela mostra um aviso amarelo, sem componente separado por enquanto.
- **Cache vazio para a página pedida:** o serviço relança o erro da API, e a tela mantém o banner de erro.
- **Total offline:** vale a quantidade de produtos salvos, então a paginação para no fim do cache.
- **Coluna `created_at` em `cart_items`:** acrescentada para manter os itens na ordem em que foram adicionados.
- **Sem `cartService` por enquanto:** o contexto do carrinho usa o repositório direto. O serviço entra na etapa 6, quando existir regra de negócio (gravar o item e a operação pendente na mesma transação).
- **Botão do carrinho no cabeçalho:** a tela de lista e a de detalhes mostram a quantidade de itens.
- **Uma operação por toque:** cada "Adicionar ao carrinho" cria uma operação `ADD_TO_CART` com quantidade 1. O carrinho mostra uma linha por produto, e a fila guarda o histórico a enviar.
- **`cartService`:** criado nesta etapa, para gravar o item e a operação na mesma transação.
- **Transações serializadas:** o `db.js` expõe `runInTransaction`, que executa uma transação de cada vez, porque o SQLite não aceita transações aninhadas.
- **Identificador da operação:** o `operation_uuid` é gerado com `Crypto.randomUUID()` (`expo-crypto`).
- **Aviso de pendentes antecipado:** a tela do carrinho já mostra quantas operações aguardam sincronização. O restante do tratamento de erros fica na etapa 8.
- **Operações com falha:** o carrinho mostra um aviso vermelho com a quantidade de operações `failed` e permite reenviá-las. O reenvio devolve as operações para a fila com as tentativas zeradas. Elas continuam sem reenvio automático, de propósito, para não repetir uma falha permanente indefinidamente.
- **`StatusBanner`:** componente criado para os avisos do carrinho. As telas de lista e detalhes mantêm os avisos próprios.