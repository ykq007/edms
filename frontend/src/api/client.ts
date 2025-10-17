type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = RequestInit & {
  method?: HttpMethod;
};

type TokenProvider = () => string | null;

let getToken: TokenProvider = () => null;

export const setAuthTokenProvider = (provider: TokenProvider) => {
  getToken = provider;
};

const DEFAULT_BASE_URL = 'http://localhost:3000';

const getBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL;
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

export async function apiRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const baseUrl = getBaseUrl();
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers ?? {});
  const token = getToken();

  if (!(options.body instanceof FormData) && options.method !== 'GET' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Request failed';

    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.message ?? errorMessage;
    } catch (error) {
      const fallbackMessage = await response.text();
      if (fallbackMessage) {
        errorMessage = fallbackMessage;
      }
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as TResponse;
  }

  return (await response.text()) as unknown as TResponse;
}
