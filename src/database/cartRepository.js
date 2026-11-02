import { getDb } from './db';

// Itens do carrinho, na ordem em que foram adicionados
export async function getCartItems() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM cart_items ORDER BY created_at, product_id');
}

// Adiciona um produto. Se ele já está no carrinho, soma a quantidade
export async function addToCart(product, quantity = 1) {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO cart_items
       (product_id, title, price, thumbnail, quantity, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
     ON CONFLICT(product_id) DO UPDATE SET
       quantity = quantity + excluded.quantity,
       sync_status = 'pending',
       updated_at = excluded.updated_at`,
    [product.id, product.title, product.price, product.thumbnail ?? null, quantity, now, now]
  );
}

// Define a quantidade de um item (precisa ser 1 ou mais)
export async function setCartQuantity(productId, quantity) {
  const db = await getDb();
  await db.runAsync('UPDATE cart_items SET quantity = ?, updated_at = ? WHERE product_id = ?', [
    quantity,
    new Date().toISOString(),
    productId,
  ]);
}

export async function removeFromCart(productId) {
  const db = await getDb();
  await db.runAsync('DELETE FROM cart_items WHERE product_id = ?', [productId]);
}

// Marca se o item já foi totalmente enviado ('synced') ou ainda não ('pending')
export async function setCartItemSyncStatus(productId, status) {
  const db = await getDb();
  await db.runAsync('UPDATE cart_items SET sync_status = ? WHERE product_id = ?', [
    status,
    productId,
  ]);
}