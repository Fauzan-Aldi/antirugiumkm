import {getToken} from './token';

type ApiError = {message?: string};

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const json = (await res.json().catch(() => null)) as T | ApiError | null;
  if (!res.ok) {
    const msg = (json as ApiError | null)?.message ?? `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

export async function apiFetchNoAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const json = (await res.json().catch(() => null)) as T | ApiError | null;
  if (!res.ok) {
    const msg = (json as ApiError | null)?.message ?? `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

