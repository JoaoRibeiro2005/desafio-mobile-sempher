import { request, ApiError } from './api';
import {
  saveProducts,
  getCachedProducts,
  countCachedProducts,
} from '../database/productsRepository';

export const PAGE_SIZE = 20;

// Devolve { products, total, skip, limit, fromCache }
// API primeiro; se falhar, tenta o que foi salvo no SQLite
export async function getProducts({ limit = PAGE_SIZE, skip = 0 } = {}) {
  try {
    const data = await request(`/products?limit=${limit}&skip=${skip}`);
    await saveToCache(data.products);
    return { ...data, fromCache: false };
  } catch (error) {
    return getFromCacheOrThrow(error, { limit, skip });
  }
}

export function getProductById(id) {
  return request(`/products/${id}`);
}

// Falha ao salvar o cache não pode derrubar a tela: o usuário já tem os dados
async function saveToCache(products) {
  try {
    await saveProducts(products);
  } catch (e) {
    console.warn('Não foi possível salvar o cache de produtos:', e);
  }
}

async function getFromCacheOrThrow(originalError, { limit, skip }) {
  let cached = [];
  let total = 0;

  try {
    cached = await getCachedProducts({ limit, offset: skip });
    total = await countCachedProducts();
  } catch (e) {
    console.warn('Não foi possível ler o cache de produtos:', e);
  }

  // Nada salvo para essa página
  if (cached.length === 0) {
    // Primeira página, sem rede e sem nada salvo: orienta o usuário
    if (skip === 0 && originalError.isNetworkError) {
      throw new ApiError(
        'Sem conexão e nenhum dado salvo. Conecte-se à internet ao menos uma vez para carregar os produtos.',
        { isNetworkError: true }
      );
    }
    // Falha no meio da paginação ou erro do servidor: mantém o erro original
    throw originalError;
  }

  return { products: cached, total, skip, limit, fromCache: true };
}