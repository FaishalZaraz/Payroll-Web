import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3001', // Your backend API URL
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
} = authClient;
