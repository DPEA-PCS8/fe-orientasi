import type { UserInfo, LoginResponse as LoginResponseType } from '../types/auth.types';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';

// RSA Public Key from backend config (Base64 encoded, without PEM headers)
const RSA_PUBLIC_KEY_BASE64 = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApm4C3tMo4URx1/f/BXfGktEHNQYX0Ew3mUbn5nw9Ot734r9epwCp2XN/CDVw26iU66621gQvmMRib9fu+KNuhNTB30HrGAM065Jtvn3/dZ3g1SpquLj5/oQjeVUns6DsG7MhW4uZEXjf28iwZTm5xU9kIg3bsXEsWGRC1rKVYmIRfsM00iHi7A7MvRanbCQ1cgPC9ZZqqLFjZokqb5//5I/kJCilbE3Cn5/Mc/+XhOh5HQvgRn8HJ+zvMiKTytmks+s3/0L5l2fEnDSIxiP/ZchNGzuTOqc7jFA6UpBhLUj1QO76k1KT00V5IPqHsPWb8YzUztjysN6i5IUiMQCE9wIDAQAB';

export interface LoginResponse {
  status: number;
  message: string;
  data: LoginResponseType;
}

/**
 * Import RSA public key for Web Crypto API
 */
async function importPublicKey(): Promise<CryptoKey> {
  const binaryString = atob(RSA_PUBLIC_KEY_BASE64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );
}

/**
 * Encrypt password using RSA-OAEP with SHA-256 (matching backend)
 */
export async function encryptPassword(password: string): Promise<string> {
  const publicKey = await importPublicKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    data
  );

  const encryptedArray = new Uint8Array(encrypted);
  let binary = '';
  for (let i = 0; i < encryptedArray.length; i++) {
    binary += String.fromCharCode(encryptedArray[i]);
  }
  return btoa(binary);
}

/**
 * Login API call
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const encryptedPassword = await encryptPassword(password);

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
    },
    body: JSON.stringify({
      username,
      password: encryptedPassword,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return data;
}

/**
 * Store auth data in localStorage or sessionStorage
 */
export function storeAuthData(token: string, userInfo: UserInfo, rememberMe: boolean = false): void {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('auth_token', token);
  storage.setItem('user_info', JSON.stringify(userInfo));
}

/**
 * Get stored user info
 */
export function getUserInfo(): UserInfo | null {
  const userInfoStr = localStorage.getItem('user_info') || sessionStorage.getItem('user_info');
  if (!userInfoStr) return null;
  try {
    return JSON.parse(userInfoStr);
  } catch {
    return null;
  }
}

/**
 * Get stored auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

/**
 * Clear auth data (logout)
 */
export function clearAuthData(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('user_info');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Check if user has a role assigned
 */
export function hasRole(): boolean {
  const userInfo = getUserInfo();
  return userInfo?.has_role ?? false;
}

/**
 * Get user's roles
 */
export function getUserRoles(): string[] {
  const userInfo = getUserInfo();
  return userInfo?.roles ?? [];
}

/**
 * Check if user has specific role
 */
export function hasRoleName(roleName: string): boolean {
  const roles = getUserRoles();
  return roles.includes(roleName);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(roleNames: string[]): boolean {
  const roles = getUserRoles();
  return roleNames.some(roleName => roles.includes(roleName));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(roleNames: string[]): boolean {
  const roles = getUserRoles();
  return roleNames.every(roleName => roles.includes(roleName));
}

/**
 * Check if user has Admin role
 */
export function isAdmin(): boolean {
  return hasRoleName('Admin');
}

/**
 * Check if user has Pengembang role
 */
export function isPengembang(): boolean {
  return hasRoleName('Pengembang');
}

/**
 * Check if user has SKPA role
 */
export function isSKPA(): boolean {
  return hasRoleName('SKPA');
}
