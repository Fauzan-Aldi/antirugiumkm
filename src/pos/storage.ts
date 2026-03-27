export function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function readFromStorage<T>(key: string, fallback: T): T {
  const parsed = safeJsonParse<T>(localStorage.getItem(key));
  return parsed ?? fallback;
}

export function writeToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

