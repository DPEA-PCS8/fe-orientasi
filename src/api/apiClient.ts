/**
 * Centralized API Client
 * Handles all HTTP requests with automatic 401 (token expired) detection and logout
 */

import { getAuthToken, handleLogout } from './authApi';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';

export interface BaseApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

/**
 * Centralized API request helper with auto-logout on 401
 * Use this for ALL API calls to ensure consistent behavior
 */
export async function apiRequest<T>(
  url: string,
  method: string = 'GET',
  body?: unknown
): Promise<BaseApiResponse<T>> {
  const token = getAuthToken();

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Check for 401 Unauthorized (token expired) - AUTO LOGOUT
  if (response.status === 401) {
    handleLogout('Sesi Anda telah berakhir. Silakan login kembali.');
    throw new Error('Unauthorized - Session expired');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

/**
 * Get standard headers with auth token
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'APIKey': API_KEY,
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Check response and handle 401 automatically
 * Use this after fetch() calls that don't use apiRequest()
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  // Check for 401 Unauthorized (token expired) - AUTO LOGOUT
  if (response.status === 401) {
    handleLogout('Sesi Anda telah berakhir. Silakan login kembali.');
    throw new Error('Unauthorized - Session expired');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}
