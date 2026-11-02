# Preparação dos testes

Este documento reúne, etapa por etapa, as alterações **temporárias** de código usadas para provocar cada cenário dos testes (falhas simuladas, cache vazio, fila visível no terminal etc.). Nenhuma delas faz parte do código entregue: foram aplicadas só durante os testes.

Os resultados de cada cenário estão em [TESTES.md](TESTES.md). Os nomes dos cenários abaixo são os mesmos das tabelas de lá.

**Como reiniciar o app do zero** depois de salvar uma alteração: apertar `r` no terminal onde o `npx expo start` está rodando. Cenários marcados como "modo avião real" usam o recurso do próprio iPhone e não precisam de alteração no código.

## Etapa 2: listagem de produtos

| Cenário | Alteração temporária |
| --- | --- |
| Carga inicial | Nenhuma |
| Paginação | Nenhuma |
| Puxar para atualizar | Nenhuma |
| Sem internet ao abrir (falha simulada no código) | A1 |
| Tentar novamente | A1 |
| Falha forçada durante a paginação | A1, salvando o arquivo com a lista já carregada (o Fast Refresh mantém o estado da tela, então a falha acontece na paginação) |
| Erro do servidor | A2 |
| Tempo esgotado | A3 |
| Perda de rede durante a paginação | Nenhuma (modo avião real, com a lista já carregada) |
| Reconexão | Nenhuma (desligar o modo avião) |
| Banner tocável | Nenhuma |

**A1. Falha forçada na primeira requisição** (`src/services/api.js`)

Fora da função, logo abaixo das constantes:

```javascript
let firstCall = true; // TEMPORÁRIO
```

Como primeiras linhas de dentro da função `request`:

```javascript
if (firstCall) {
  firstCall = false;
  throw new ApiError('Não foi possível conectar. Verifique sua internet.', {
    isNetworkError: true,
  });
}
```

**A2. Erro do servidor** (`src/services/productsService.js`)

Trocar `/products?limit=` por `/produtos?limit=` dentro de `getProducts`. A API responde 404.

**A3. Tempo esgotado** (`src/services/api.js`)

Trocar `TIMEOUT_MS = 10000` por `TIMEOUT_MS = 1`. O pedido é cancelado quase na hora.

## Etapa 3: SQLite e cache de produtos

Os cenários desta etapa usam três chaves temporárias. Todas ficam em `false` por padrão.

| Cenário | Alteração temporária |
| --- | --- |
| Cache sendo salvo | Nenhuma |
| Abrir sem internet, com cache | `SIMULATE_OFFLINE = true` |
| Persistência ao fechar o app | `SIMULATE_OFFLINE = true`, fechando o Expo Go por completo e abrindo de novo |
| Paginação offline | `SIMULATE_OFFLINE = true` |
| Puxar para atualizar offline | Nenhuma (modo avião real) |
| Imagens offline | Nenhuma (modo avião real) |
| Voltar a conexão | Nenhuma (desligar o modo avião e tocar no aviso) |
| Erro do servidor com cache | `SIMULATE_SERVER_ERROR = true` |
| Sem internet e sem cache | `RESET_CACHE = true` e `SIMULATE_OFFLINE = true` |
| Erro do servidor sem cache | `RESET_CACHE = true` e `SIMULATE_SERVER_ERROR = true` |
| Perda de rede além do cache | `RESET_CACHE = true` para deixar só a primeira página salva; depois `RESET_CACHE = false` e modo avião real ao rolar |

**B1. Chaves de rede simuladas** (`src/services/api.js`)

Abaixo das constantes:

```javascript
// ===== TEMPORÁRIO: chaves de teste =====
const SIMULATE_OFFLINE = false; // true = finge que não há internet
const SIMULATE_SERVER_ERROR = false; // true = finge erro 404 do servidor
```

Como primeiras linhas de dentro da função `request`:

```javascript
if (SIMULATE_OFFLINE) {
  throw new ApiError('Não foi possível conectar. Verifique sua internet.', {
    isNetworkError: true,
  });
}
if (SIMULATE_SERVER_ERROR) {
  throw new ApiError('Erro do servidor (404).', { status: 404 });
}
```

**B2. Cache vazio** (`src/database/db.js`)

Abaixo do `getDb`:

```javascript
// TEMPORÁRIO: true = apaga os produtos salvos ao abrir o app
const RESET_CACHE = false;
```

Dentro de `openAndSetup`, logo depois de abrir o banco e antes do `CREATE TABLE`:

```javascript
if (RESET_CACHE) {
  await db.execAsync('DROP TABLE IF EXISTS products;');
}
```

Observação: com produtos salvos, o cenário "Erro do servidor" da etapa 2 deixa de mostrar o erro 404 e passa a exibir os dados salvos. Para ver o erro de servidor puro, é preciso o cache vazio (cenário "Erro do servidor sem cache").

## Etapa 4: tela de detalhes

| Cenário | Alteração temporária |
| --- | --- |
| Detalhes online | Nenhuma |
| Detalhes offline, com dados salvos | Nenhuma (modo avião real) |
| Detalhes ao reconectar | Nenhuma (desligar o modo avião) |
| Produto inexistente, sem cache | D1 |
| Voltar rápido da tela | Nenhuma na versão simples (abrir e voltar várias vezes); D2 na versão com prova |

**D1. Produto que não existe** (`src/screens/ProductListScreen.js`)

Trocar `productId: item.id` por `productId: 9999` na navegação para os detalhes. A API responde 404 e não há nada salvo para esse id.

**D2. Resposta chegando depois de sair da tela** (opcional)

Em `src/services/productsService.js`, no começo de `fetchProduct`:

```javascript
await new Promise((resolve) => setTimeout(resolve, 3000)); // TEMPORÁRIO
```

Em `src/screens/ProductDetailScreen.js`, logo depois de `const fresh = await fetchProduct(productId);`:

```javascript
console.log('Resposta chegou. Tela ainda ativa?', active); // TEMPORÁRIO
```

E dentro da função devolvida pelo `useEffect`, antes de `active = false;`:

```javascript
console.log('Saiu da tela'); // TEMPORÁRIO
```

Abrir um produto e voltar em menos de 3 segundos. O terminal mostra "Saiu da tela" e, depois, "Resposta chegou. Tela ainda ativa? false".

## Etapa 5: carrinho local

Nenhum cenário desta etapa precisa de alteração no código. Antes de testar, o carrinho foi esvaziado pelo botão "Remover", e o cenário "Carrinho offline" usa o modo avião real.

## Etapa 6: fila de operações pendentes

| Cenário | Alteração temporária |
| --- | --- |
| Uma operação | F1 com `SHOW_QUEUE_LOG = true` |
| Mesmo produto 3 vezes | F1 com `SHOW_QUEUE_LOG = true` |
| Produtos diferentes | F1 com `SHOW_QUEUE_LOG = true` |
| Remover descarta pendentes | F1 com `SHOW_QUEUE_LOG = true` |
| Quantidade é local | F1 com `SHOW_QUEUE_LOG = true` |
| Persistência da fila | F1 com `SHOW_QUEUE_LOG = true` |
| Adicionar offline | F1 com `SHOW_QUEUE_LOG = true` e modo avião real |
| Toques rápidos | F1 com `SHOW_QUEUE_LOG = true` |
| Tudo ou nada | F1 com `SIMULATE_ROLLBACK = true` |

**F1. Fila visível e falha simulada** (`src/services/cartService.js`)

O import de `../database/db` ganha o `getDb`:

```javascript
import { getDb, runInTransaction } from '../database/db';
```

Abaixo da constante `USER_ID`:

```javascript
// ===== TEMPORÁRIO: chaves de teste =====
const SHOW_QUEUE_LOG = true; // mostra a fila de operações no terminal
const SIMULATE_ROLLBACK = false; // true = falha depois de gravar o item
```

Dentro de `loadCart`, antes do `return`:

```javascript
if (SHOW_QUEUE_LOG) {
  const db = await getDb();
  const fila = await db.getAllAsync(
    'SELECT id, operation_uuid, payload, status, attempts FROM pending_operations'
  );
  console.log('FILA:', JSON.stringify(fila));
}
```

Dentro de `addProductToCart`, logo depois de `await addToCart(product, 1);`:

```javascript
if (SIMULATE_ROLLBACK) {
  throw new Error('falha simulada');
}
```

No cenário "Tudo ou nada", o esperado é que o item não entre no carrinho, que a fila não ganhe linha e que a tela de detalhes mostre a mensagem de erro, o que prova que a gravação do item e da operação é uma transação só. O `FILA:` não aparece nesse cenário, porque a falha impede o `loadCart`.

## Etapa 7: conectividade e sincronização

| Cenário | Alteração temporária |
| --- | --- |
| Envio online | H2 |
| Adicionar offline | H2 e modo avião real |
| Reconexão automática | H2 e modo avião real |
| Várias offline, sem duplicar | H2 e H3 (para contar os envios), com modo avião real |
| Toques rápidos com envio ativo | H2 e H3 |
| Falha de rede no envio | H1 com `SIMULATE_CART_OFFLINE = true` e H2 |
| Erro do servidor | H1 com `SIMULATE_CART_SERVER_ERROR = true` e H2 |
| Remover antes de reconectar | H2 e H3, com modo avião real |
| App fechado durante o envio | H2 e H3 com a linha do atraso de 8 segundos ativa |
| Persistência da fila | H2, com modo avião real |

**H1. Falhas simuladas só no carrinho** (`src/services/api.js`)

Abaixo das constantes:

```javascript
const SIMULATE_CART_OFFLINE = false; // TEMPORÁRIO
const SIMULATE_CART_SERVER_ERROR = false; // TEMPORÁRIO
```

Como primeiras linhas de dentro da função `request`:

```javascript
if (path.startsWith('/carts')) {
  if (SIMULATE_CART_OFFLINE) {
    throw new ApiError('Não foi possível conectar. Verifique sua internet.', {
      isNetworkError: true,
    });
  }
  if (SIMULATE_CART_SERVER_ERROR) {
    throw new ApiError('Erro do servidor (500).', { status: 500 });
  }
}
```

**H2. Fila visível no terminal** (`src/services/cartService.js`)

O import de `../database/db` ganha o `getDb`:

```javascript
import { getDb, runInTransaction } from '../database/db';
```

Dentro de `loadCart`, antes do `return`:

```javascript
// TEMPORÁRIO: mostra a fila no terminal
const db = await getDb();
const fila = await db.getAllAsync(
  'SELECT id, status, attempts, last_error, synced_at FROM pending_operations'
);
console.log('FILA:', JSON.stringify(fila));
```

**H3. Contagem de envios e atraso** (`src/services/syncService.js`)

Dentro do `try` do `processQueue`, antes de `await sendOperation(operation);`:

```javascript
console.log('ENVIANDO operação', operation.id);
// await new Promise((resolve) => setTimeout(resolve, 8000)); // TEMPORÁRIO: só no teste de fechar o app
```

## Conferir que nada disso ficou no código entregue

Na raiz do projeto:

```
git grep -n -E "TEMPORÁRIO|SIMULATE_|RESET_CACHE|SHOW_QUEUE_LOG|ENVIANDO|FILA:|firstCall|9999" -- src App.js
```

O comando não deve listar nenhuma linha.