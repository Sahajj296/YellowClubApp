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
import { DEMO_AUTH } from '../config/env';

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
    const bootstrap = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (mounted && stored) {
          setAuthUserState(JSON.parse(stored) as AuthUser);
        }
      } catch (error) {
        console.warn('[AuthProvider] Failed to hydrate auth user', error);
      } finally {
        if (mounted) setInitializing(false);
      }
    };
    bootstrap();

    if (DEMO_AUTH) {
      return () => {
        mounted = false;
      };
    }

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (!user) {
        persistAuthUser(null).catch(() => {});
        return;
      }
      persistAuthUser({
        uid: user.uid,
        email: user.email ?? '',
        name: user.displayName ?? undefined,
      }).catch(() => {});
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [persistAuthUser]);

  const logout = useCallback(async () => {
    if (!DEMO_AUTH) {
      try {
        await signOut(auth);
      } catch (error) {
        console.warn('[AuthProvider] signOut failed', error);
      }
    }
    await persistAuthUser(null);
  }, [persistAuthUser]);

  const value = useMemo<AuthContextType>(
    () => ({
      authUser,
      setAuthUser: persistAuthUser,
      logout,
    }),
    [authUser, logout, persistAuthUser],
  );

  if (initializing) {
    return <></>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
