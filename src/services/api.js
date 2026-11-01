const BASE_URL = 'https://dummyjson.com';
const TIMEOUT_MS = 10000; // 10 segundos

// Erro próprio, para a tela saber se foi falta de conexão ou erro do servidor
export class ApiError extends Error {
  constructor(message, { status = null, isNetworkError = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

export async function request(path, options = {}) {
  // AbortController permite cancelar a requisição se ela demorar demais
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    // fetch NÃO lança erro em 404/500, então verificamos manualmente
    if (!response.ok) {
      throw new ApiError(`Erro do servidor (${response.status}).`, {
        status: response.status,
      });
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Sem internet ou tempo esgotado: o fetch lança uma exceção
    throw new ApiError('Não foi possível conectar. Verifique sua internet.', {
      isNetworkError: true,
    });
  } finally {
    clearTimeout(timer); // sempre limpa o cronômetro
  }
}