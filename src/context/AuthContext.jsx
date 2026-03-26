import { createContext, useContext } from 'react';
import { useSession, signOut } from '../lib/auth-client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data, isPending } = useSession();

  const user = data?.user || null;
  const isAuthenticated = !!user;

  const logout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  if (isPending) {
    // Basic full-screen loading state consistent with dark theme
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}>
        Memuat sesi...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
