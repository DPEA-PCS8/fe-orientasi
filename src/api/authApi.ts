import JSEncrypt from 'jsencrypt';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';

// RSA Public Key from backend config
const RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApm4C3tMo4URx1/f/BXfG
ktEHNQYX0Ew3mUbn5nw9Ot734r9epwCp2XN/CDVw26iU66621gQvmMRib9fu+KNu
hNTB30HrGAM065Jtvn3/dZ3g1SpquLj5/oQjeVUns6DsG7MhW4uZEXjf28iwZTm5
xU9kIg3bsXEsWGRC1rKVYmIRfsM00iHi7A7MvRanbCQ1cgPC9ZZqqLFjZokqb5//
5I/kJCilbE3Cn5/Mc/+XhOh5HQvgRn8HJ+zvMiKTytmks+s3/0L5l2fEnDSIxiP/
ZchNGzuTOqc7jFA6UpBhLUj1QO76k1KT00V5IPqHsPWb8YzUztjysN6i5IUiMQCE
9wIDAQAB
-----END PUBLIC KEY-----`;

export interface UserInfo {
  uuid: string;
  username: string;
  full_name: string;
  email: string;
  division: string;
}

export interface LoginResponse {
  status_code: number;
  message: string;
  data: {
    token: string;
    user_info: UserInfo;
  };
}

/**
 * Encrypt password using RSA public key
 */
export function encryptPassword(password: string): string {
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(RSA_PUBLIC_KEY);
  const encrypted = encrypt.encrypt(password);
  if (!encrypted) {
    throw new Error('Failed to encrypt password');
  }
  return encrypted;
}

/**
 * Login API call
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const encryptedPassword = encryptPassword(password);

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
