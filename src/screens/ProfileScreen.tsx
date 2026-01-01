import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useBookings } from '../store/BookingContext';
import { useAuth } from '../context/AuthContext';
import { useProfile, type Profile } from '../context/ProfileContext';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

type ProfileRouteProp = RouteProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const { clearBookings } = useBookings();
  const { authUser, logout, setAuthUser } = useAuth();
  const {
    currentUserProfile,
    viewedProfile,
    hydrateCurrentUser,
    setViewedProfile,
    clearViewedProfile,
    clearProfile,
  } = useProfile();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const route = useRoute<ProfileRouteProp>();
  const params: RootStackParamList['Profile'] = route.params ?? {};
  const hostId = params.hostId ?? params.userId;
  const profileUserId = hostId ?? currentUserProfile?.id ?? authUser?.uid ?? null;
  const isOwnProfile = !hostId || hostId === currentUserProfile?.id;
  const activeProfile = useMemo(
    () => (hostId ? viewedProfile : currentUserProfile),
    [currentUserProfile, hostId, viewedProfile],
  );

  const loadProfileById = useCallback(
    async (userId: string, scope: 'self' | 'host') => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const snapshot = await getDoc(doc(db, 'users', userId));
        if (!snapshot.exists()) {
          if (scope === 'host') {
            setViewedProfile(null);
            setProfileError('This profile is unavailable right now.');
          }
          return;
        }
        const data = snapshot.data() ?? {};
        const normalized: Profile = {
          id: userId,
          name: data.name ?? '',
          email: data.email ?? userId,
          role: data.role === 'organizer' ? 'organizer' : 'user',
        };
        if (scope === 'host') {
          setViewedProfile(normalized);
        } else {
          await hydrateCurrentUser(normalized);
        }
      } catch (error) {
        console.error('Failed to load profile', error);
        if (scope === 'host') {
          setViewedProfile(null);
          setProfileError('We could not load this profile.');
        }
      } finally {
        setProfileLoading(false);
      }
    },
    [hydrateCurrentUser, setViewedProfile],
  );

  useEffect(() => {
    if (hostId && profileUserId) {
      const scope: 'self' | 'host' = isOwnProfile ? 'self' : 'host';
      if (scope === 'self') {
        clearViewedProfile();
      }
      loadProfileById(profileUserId, scope);
      return;
    }
    setProfileError(null);
    clearViewedProfile();
  }, [clearViewedProfile, isOwnProfile, loadProfileById, profileUserId]);

  useEffect(() => {
    return () => {
      clearViewedProfile();
    };
  }, [clearViewedProfile]);

  useEffect(() => {
    if (editing) return;
    setName(activeProfile?.name ?? '');
    setEmail(activeProfile?.email ?? '');
  }, [activeProfile, editing]);

  useEffect(() => {
    if (!isOwnProfile && editing) {
      setEditing(false);
    }
  }, [isOwnProfile, editing]);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    clearBookings();
    await clearProfile();
    await logout();
    setLoading(false);
  };

  const handleEdit = () => {
    if (!isOwnProfile || !activeProfile) return;
    setName(activeProfile.name ?? '');
    setEmail(activeProfile.email ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!isOwnProfile || !currentUserProfile?.id) return;
    const nextName = name.trim();
    const nextEmail = email.trim().toLowerCase();
    if (!nextName || !nextEmail) {
      Alert.alert('Profile incomplete', 'Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      const updatedProfile: Profile = {
        ...currentUserProfile,
        name: nextName,
        email: nextEmail,
        role: currentUserProfile.role,
      };
      await setDoc(
        doc(db, 'users', currentUserProfile.id),
        {
          name: updatedProfile.name,
          email: updatedProfile.email,
          role: updatedProfile.role,
        },
        { merge: true },
      );
      await hydrateCurrentUser(updatedProfile);
      if (authUser) {
        await setAuthUser({
          uid: updatedProfile.id,
          email: updatedProfile.email,
          role: updatedProfile.role,
          name: updatedProfile.name,
        });
      }
      if (viewedProfile?.id === updatedProfile.id) {
        setViewedProfile(updatedProfile);
      }
      setEditing(false);
    } catch (error) {
      Alert.alert('Update failed', 'Please try again in a moment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.infoBox}>
            {profileLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.label}>Name</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    editable={isOwnProfile}
                    autoCorrect={false}
                    placeholder="Name"
                    placeholderTextColor="#888"
                    returnKeyType="next"
                  />
                ) : (
                  <Text style={styles.value}>{activeProfile?.name ?? '—'}</Text>
                )}
                <Text style={styles.label}>Email</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    editable={isOwnProfile}
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="Email"
                    placeholderTextColor="#888"
                    returnKeyType="done"
                  />
                ) : (
                  <Text style={styles.value}>{activeProfile?.email ?? '—'}</Text>
                )}
                {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
              </>
            )}
          </View>
          {isOwnProfile &&
            (editing ? (
              <Pressable style={[styles.save, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveText}>Save Changes</Text>}
              </Pressable>
            ) : (
              <Pressable style={styles.edit} onPress={handleEdit}>
                <Text style={styles.editText}>Edit Profile</Text>
              </Pressable>
            ))}
          <Pressable
            style={({ pressed }) => [
              styles.logout,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={loading ? undefined : handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFD400" />
            ) : (
              <Text style={styles.logoutText}>Logout</Text>
            )}
          </Pressable>
          <View>
            <Text>{activeProfile?.name ?? '—'}</Text>
            {activeProfile?.role === 'organizer' && (
              <View>
                {/* ...existing host-specific UI... */}
              </View>
            )}
            {isOwnProfile && (
              <View>
                {/* ...existing Edit Profile button... */}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD600',
    paddingHorizontal: 16,
    paddingTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: '#FFFBEA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 32,
    alignItems: 'center',
    width: 260,
  },
  label: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  value: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    opacity: 0.7,
  },
  input: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD600',
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 200,
    opacity: 0.7,
  },
  edit: {
    backgroundColor: '#000',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    width: 260,
  },
  editText: {
    color: '#FFD600',
    fontWeight: '700',
    fontSize: 16,
  },
  save: {
    backgroundColor: '#FFD600',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    width: 260,
    borderWidth: 2,
    borderColor: '#000',
  },
  saveText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  logout: {
    marginTop: 16,
    backgroundColor: '#000',
    height: 48,
    borderRadius: 12,
    width: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FFD400',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
});
