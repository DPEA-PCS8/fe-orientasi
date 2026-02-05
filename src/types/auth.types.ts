export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  roles: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface ApiError {
  message: string;
  status_code: number;
}
