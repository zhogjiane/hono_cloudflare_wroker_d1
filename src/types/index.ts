export interface Bindings extends Record<string, string> {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  JWT_SECRET: string
  PASSWORD_SALT: string
}

export interface User {
  id: string
  username: string
  password?: string
  role: string
  created_at?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token: string
  user: User
}

export interface RegisterRequest {
  username: string
  password: string
  role?: string
}

export interface RegisterResponse {
  success: boolean
  user: User
} 