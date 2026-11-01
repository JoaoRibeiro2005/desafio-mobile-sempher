import { request } from './api';

export const PAGE_SIZE = 20;

// Devolve { products, total, skip, limit }
export function getProducts({ limit = PAGE_SIZE, skip = 0 } = {}) {
  return request(`/products?limit=${limit}&skip=${skip}`);
}

export function getProductById(id) {
  return request(`/products/${id}`);
}