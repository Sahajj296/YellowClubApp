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

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'organizer';
};

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
    ],
  );

  if (loading) return null;

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
};
