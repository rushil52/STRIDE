export function formatErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred';
  
  if (typeof error === 'string') return error;

  // FastAPI validation error array: [{loc: [...], msg: "...", type: "..."}]
  if (Array.isArray(error)) {
    return error
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : '';
          const msg = item.msg || 'Invalid field';
          return field ? `${field}: ${msg}` : msg;
        }
        return String(item);
      })
      .join(' | ');
  }

  // Handle object { detail: ... } or { message: ... }
  if (typeof error === 'object') {
    if (error.detail) {
      return formatErrorMessage(error.detail);
    }
    if (error.message) {
      return formatErrorMessage(error.message);
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error occurred';
    }
  }

  return String(error);
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('stride_token');
}

export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('stride_token', token);
  }
}

export function clearStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('stride_token');
  }
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error('Could not connect to STRIDE backend server. Please verify the API is running.');
  }

  if (response.status === 401) {
    clearStoredToken();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
    const errorText = formatErrorMessage(errorBody.detail || errorBody);
    throw new Error(errorText);
  }

  // Support 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
