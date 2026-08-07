/**
 * Auth service — wraps all authentication-related API calls.
 * Login uses OAuth2 form-encoding as required by FastAPI's OAuth2PasswordRequestForm.
 */

import { api } from '../lib/api';
import type { Token, UserResponse, UserCreate } from '../types/api';

/**
 * Authenticate with email + password.
 * FastAPI expects `username` (not `email`) + `password` as form fields.
 */
export async function login(email: string, password: string): Promise<Token> {
  return api.postForm<Token>('/auth/login', {
    username: email,
    password,
  });
}

/**
 * Register a new user account.
 */
export async function register(data: UserCreate): Promise<UserResponse> {
  return api.post<UserResponse>('/auth/register', data, false);
}

/**
 * Fetch the currently authenticated user's profile.
 */
export async function getMe(): Promise<UserResponse> {
  return api.get<UserResponse>('/auth/me');
}
