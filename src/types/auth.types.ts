export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface UserInfo {
  uuid: string;
  username: string;
  full_name: string;
  display_name: string;
  email: string;
  department: string;
  title: string;
  distinguished_name: string;
  last_login_at: string;
  has_role: boolean;
  roles: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  roles: string[];
  has_role: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  expires_in: number;
  user_info: UserInfo;
}

export interface ApiError {
  message: string;
  status_code: number;
}
