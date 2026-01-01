import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

type AuthUser = {
  uid: string;
  email: string;
  role?: 'user' | 'organizer';
  name?: string;
};

interface AuthContextType {
  authUser: AuthUser | null;
  setAuthUser: (user: AuthUser | null) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'auth_user';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUserState] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  const persistAuthUser = useCallback(async (user: AuthUser | null) => {
    if (user) {
      const payload: AuthUser = {
        uid: user.uid,
        email: user.email,
        role: user.role,
        name: user.name,
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
      setAuthUserState(payload);
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setAuthUserState(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadStoredUser = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (mounted && stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          setAuthUserState(parsed);
        }
      } catch (error) {
        console.warn('[AuthProvider] Failed to hydrate auth user', error);
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };
    loadStoredUser();
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (!user) {
        persistAuthUser(null).catch(() => {});
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [persistAuthUser]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn('[AuthProvider] signOut failed', error);
    } finally {
      await persistAuthUser(null);
    }
  }, [persistAuthUser]);

  const value = useMemo<AuthContextType>(
    () => ({
      authUser,
      setAuthUser: persistAuthUser,
      logout,
    }),
    [authUser, logout, persistAuthUser],
  );

  if (initializing) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
