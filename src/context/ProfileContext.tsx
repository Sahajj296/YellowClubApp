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
import { useAuth } from './AuthContext';
import { DEMO_AUTH } from '../config/env';

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'organizer';
};

type ProfileMode = 'member' | 'organizer';

interface ProfileContextType {
  profile: Profile | null;
  currentUserProfile: Profile | null;
  viewedProfile: Profile | null;
  hydrateCurrentUser: (profile: Profile) => Promise<void>;
  clearCurrentUser: () => Promise<void>;
  setViewedProfile: (profile: Profile | null) => void;
  clearViewedProfile: () => void;
  setProfile: (profile: Profile, options?: { scope?: 'current' | 'viewed' }) => Promise<void>;
  clearProfile: () => Promise<void>;
  demoRole: 'user' | 'organizer';
  switchToOrganizer: () => void;
  switchToMember: () => void;
  mode: ProfileMode;
}

const CURRENT_USER_KEY = 'profile_current_user';
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const sanitizeProfile = (incoming: Partial<Profile>): Profile => {
  const id = incoming.id || incoming.email || '';
  return {
    id,
    name: incoming.name ?? '',
    email: incoming.email ?? '',
    role: incoming.role === 'organizer' ? 'organizer' : 'user',
  };
};

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [viewedProfile, setViewedProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { authUser, setAuthUser } = useAuth();
  const [demoRole, setDemoRole] = useState<'user' | 'organizer'>(
    authUser?.role === 'organizer' ? 'organizer' : 'user',
  );
  const [mode, setMode] = useState<ProfileMode>(
    authUser?.role === 'organizer' ? 'organizer' : 'member',
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<Profile>;
          const normalized = sanitizeProfile(parsed);
          if (normalized.id) {
            setCurrentUserProfile(normalized);
          }
        }
      } catch (error) {
        console.warn('[ProfileProvider] Failed to load profile', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const hydrateCurrentUser = useCallback(
    async (profile: Profile) => {
      const normalized = sanitizeProfile(profile);
      if (!normalized.id) {
        console.warn('[ProfileProvider] Ignoring profile without identifier');
        return;
      }
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
      setCurrentUserProfile(normalized);
      if (viewedProfile?.id === normalized.id) {
        setViewedProfileState(normalized);
      }
    },
    [viewedProfile],
  );

  const clearCurrentUser = useCallback(async () => {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUserProfile(null);
  }, []);

  const setViewedProfile = useCallback((profile: Profile | null) => {
    setViewedProfileState(profile ? sanitizeProfile(profile) : null);
  }, []);

  const clearViewedProfile = useCallback(() => {
    setViewedProfileState(null);
  }, []);

  const setProfile = useCallback(
    async (profile: Profile, options?: { scope?: 'current' | 'viewed' }) => {
      const normalized = sanitizeProfile(profile);
      if (!normalized.id) {
        return;
      }
      if (options?.scope === 'current') {
        await hydrateCurrentUser(normalized);
        return;
      }
      if (options?.scope === 'viewed') {
        setViewedProfile(normalized);
        return;
      }
      if (currentUserProfile && normalized.id === currentUserProfile.id) {
        await hydrateCurrentUser(normalized);
      } else {
        setViewedProfile(normalized);
      }
    },
    [currentUserProfile, hydrateCurrentUser, setViewedProfile],
  );

  const clearProfile = useCallback(async () => {
    await clearCurrentUser();
    clearViewedProfile();
  }, [clearCurrentUser, clearViewedProfile]);

  useEffect(() => {
    if (!DEMO_AUTH) {
      if (currentUserProfile) {
        const nextMode = currentUserProfile.role === 'organizer' ? 'organizer' : 'member';
        if (mode !== nextMode) setMode(nextMode);
      }
      return;
    }
    const next = authUser?.role === 'organizer' ? 'organizer' : 'member';
    if (mode !== next) setMode(next);
  }, [DEMO_AUTH, authUser?.role, currentUserProfile, mode]);

  useEffect(() => {
    const nextRole =
      authUser?.role === 'organizer' || mode === 'organizer' ? 'organizer' : 'user';
    if (demoRole !== nextRole) {
      setDemoRole(nextRole);
    }
  }, [authUser?.role, demoRole, mode]);

  const switchToOrganizer = useCallback(() => {
    if (mode === 'organizer') return;
    setMode('organizer');
    setDemoRole('organizer');
    if (DEMO_AUTH && authUser) {
      setAuthUser({ ...authUser, role: 'organizer' }).catch(() => {});
    }
  }, [DEMO_AUTH, authUser, mode, setAuthUser]);

  const switchToMember = useCallback(() => {
    if (mode === 'member') return;
    setMode('member');
    setDemoRole('user');
    if (DEMO_AUTH && authUser) {
      setAuthUser({ ...authUser, role: 'user' }).catch(() => {});
    }
  }, [DEMO_AUTH, authUser, mode, setAuthUser]);

  useEffect(() => {
    if (!DEMO_AUTH || !authUser?.email) {
      return;
    }
    const derivedName =
      authUser.name ?? (authUser.email.includes('@') ? authUser.email.split('@')[0] : authUser.email);
    const profileId = authUser.uid || authUser.email;
    const nextProfile: Profile = {
      id: profileId,
      name: derivedName,
      email: authUser.email,
      role: mode === 'organizer' ? 'organizer' : 'user',
    };
    if (
      currentUserProfile &&
      currentUserProfile.id === nextProfile.id &&
      currentUserProfile.role === nextProfile.role &&
      currentUserProfile.email === nextProfile.email &&
      currentUserProfile.name === nextProfile.name
    ) {
      return;
    }
    hydrateCurrentUser(nextProfile).catch(() => {});
  }, [DEMO_AUTH, authUser, currentUserProfile, hydrateCurrentUser, mode]);

  const value = useMemo<ProfileContextType>(
    () => ({
      profile: viewedProfile ?? currentUserProfile,
      currentUserProfile,
      viewedProfile,
      hydrateCurrentUser,
      clearCurrentUser,
      setViewedProfile,
      clearViewedProfile,
      setProfile,
      clearProfile,
      demoRole,
      switchToOrganizer,
      switchToMember,
      mode,
    }),
    [
      clearCurrentUser,
      clearProfile,
      clearViewedProfile,
      currentUserProfile,
      hydrateCurrentUser,
      setProfile,
      setViewedProfile,
      viewedProfile,
      demoRole,
      switchToOrganizer,
      switchToMember,
      mode,
    ],
  );

  if (loading) {
    return <></>;
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
};
