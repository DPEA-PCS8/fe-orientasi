import type { UserInfo } from '../types/auth.types';

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
 * Handle logout and redirect to login page
 * This is called when token expires (401) or user manually logs out
 */
export function handleLogout(message?: string): void {
  clearAuthData();
  
  // Store optional message to show after redirect
  if (message) {
    sessionStorage.setItem('logout_message', message);
  }
  
  // Redirect to login page
  window.location.href = '/login';
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

/**
 * Decode JWT token payload (without validation)
 * Useful for debugging token contents
 */
export function decodeJwtPayload(): Record<string, unknown> | null {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if JWT token has required claims for API calls
 */
export function validateTokenClaims(): { valid: boolean; missingClaims: string[]; payload: Record<string, unknown> | null } {
  const payload = decodeJwtPayload();
  if (!payload) {
    return { valid: false, missingClaims: ['Token tidak ditemukan atau tidak valid'], payload: null };
  }

  const requiredClaims = ['uuid', 'roles'];
  const missingClaims = requiredClaims.filter(claim => !(claim in payload));

  // Check token expiration
  if (payload.exp && typeof payload.exp === 'number') {
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      missingClaims.push('Token sudah expired');
    }
  }

  return {
    valid: missingClaims.length === 0,
    missingClaims,
    payload
  };
}

/**
 * Debug function to log token info to console
 */
export function debugToken(): void {
  const result = validateTokenClaims();
  console.group('🔐 Token Debug Info');
  console.log('Valid:', result.valid);
  if (result.missingClaims.length > 0) {
    console.warn('Missing/Issues:', result.missingClaims);
  }
  if (result.payload) {
    console.log('Payload:', result.payload);
    if (result.payload.exp) {
      const expDate = new Date((result.payload.exp as number) * 1000);
      console.log('Expires:', expDate.toLocaleString());
    }
  }
  console.groupEnd();
}
