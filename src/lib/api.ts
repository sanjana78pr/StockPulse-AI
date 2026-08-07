/**
 * Core API client — typed fetch wrapper.
 *
 * Responsibilities:
 *  - Attach Authorization: Bearer <token> header automatically
 *  - Parse backend error shape { success, error: { code, message } }
 *  - On 401 → clear stored token and redirect to /login
 *  - Throw ApiError on any non-2xx response
 */

import { ApiError } from '../types/api';

// ---------------------------------------------------------------------------
// Base URL — reads from Vite env, falls back to local dev backend
// ---------------------------------------------------------------------------
export const BASE_URL =
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL ??
  'http://127.0.0.1:8000/api/v1';

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'sp_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Internal redirect helper (avoids importing React Router here)
// ---------------------------------------------------------------------------
function redirectToLogin(): void {
  clearToken();
  // Use native navigation so this module stays framework-agnostic
  window.location.href = '/login';
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------
async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Attach auth header unless caller explicitly passes authenticated=false
  if (authenticated) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Only set Content-Type to JSON when we have a body, it's a string,
  // AND the caller hasn't already set a Content-Type (e.g. form-encoded login)
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'Unable to reach the server. Please check your connection.',
      'NETWORK_ERROR',
      0,
    );
  }

  // Auto-logout on 401 — but only if we're not already on the login page
  // (prevents an infinite redirect loop when login itself returns 401)
  if (response.status === 401 && !window.location.pathname.includes('/login')) {
    redirectToLogin();
    throw new ApiError('Session expired. Please log in again.', 'UNAUTHORIZED', 401);
  }

  // Parse body — backend always returns JSON
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(`Server returned non-JSON response (${response.status})`, 'PARSE_ERROR', response.status);
  }

  if (!response.ok) {
    // Backend error shape: { success: false, error: { code, message } }
    const errBody = body as { success?: boolean; error?: { code?: string; message?: string } };
    const message = errBody?.error?.message ?? `Request failed with status ${response.status}`;
    const code = errBody?.error?.code ?? 'API_ERROR';
    throw new ApiError(message, code, response.status);
  }

  return body as T;
}

// ---------------------------------------------------------------------------
// Public HTTP helpers
// ---------------------------------------------------------------------------
export const api = {
  get<T>(path: string, authenticated = true): Promise<T> {
    return request<T>(path, { method: 'GET' }, authenticated);
  },

  post<T>(path: string, body: unknown, authenticated = true): Promise<T> {
    return request<T>(
      path,
      { method: 'POST', body: JSON.stringify(body) },
      authenticated,
    );
  },

  /** Special overload for OAuth2 form-encoded login */
  postForm<T>(path: string, params: Record<string, string>): Promise<T> {
    const encoded = new URLSearchParams(params).toString();
    return request<T>(
      path,
      {
        method: 'POST',
        body: encoded,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
      false, // no auth token needed for login
    );
  },

  patch<T>(path: string, body: unknown, authenticated = true): Promise<T> {
    return request<T>(
      path,
      { method: 'PATCH', body: JSON.stringify(body) },
      authenticated,
    );
  },

  put<T>(path: string, body: unknown, authenticated = true): Promise<T> {
    return request<T>(
      path,
      { method: 'PUT', body: JSON.stringify(body) },
      authenticated,
    );
  },

  delete<T>(path: string, authenticated = true): Promise<T> {
    return request<T>(path, { method: 'DELETE' }, authenticated);
  },
};
