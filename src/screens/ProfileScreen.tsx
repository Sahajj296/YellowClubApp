import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useBookings } from '../store/BookingContext';
import { useAuth } from '../context/AuthContext';
import { useProfile, type Profile } from '../context/ProfileContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { trackEvent } from '../services/analytics';
import { DEMO_AUTH } from '../config/env';
import Avatar from '../components/Avatar';

export default function ProfileScreen() {
	const { clearBookings } = useBookings();
  const { authUser, logout, setAuthUser } = useAuth();
  const {
    currentUserProfile,
    hydrateCurrentUser,
    clearProfile,
    switchToOrganizer,
    switchToMember,
    mode,
  } = useProfile();
  const [profileMode, setProfileMode] = useState<'member' | 'organizer'>('member');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const hasTrackedView = useRef(false);
  const canEdit = true;
  const canSwitchRole = true;
  const activeProfile = currentUserProfile;

  useEffect(() => {
    setProfileMode(mode);
  }, [mode]);

  useEffect(() => {
    if (profileLoading || !activeProfile || hasTrackedView.current) return;
    hasTrackedView.current = true;
    trackEvent('view_profile', { scope: 'self', role: activeProfile.role });
  }, [activeProfile, profileLoading]);

  useEffect(() => {
    if (DEMO_AUTH || activeProfile || !authUser?.uid) {
      setProfileLoading(false);
      return;
    }
    let mounted = true;
    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const snapshot = await getDoc(doc(db, 'users', authUser.uid));
        if (snapshot.exists() && mounted) {
          const data = snapshot.data() ?? {};
          await hydrateCurrentUser({
            id: authUser.uid,
            name: data.name ?? authUser.email ?? '',
            email: data.email ?? authUser.email ?? '',
            role: data.role === 'organizer' ? 'organizer' : 'user',
          });
        }
      } catch {
        mounted && setProfileError('We could not load your profile.');
      } finally {
        mounted && setProfileLoading(false);
      }
    };
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [DEMO_AUTH, activeProfile, authUser?.email, authUser?.uid, hydrateCurrentUser]);

  useEffect(() => {
    if (!activeProfile || editing) return;
    setName(activeProfile.name ?? '');
    setEmail(activeProfile.email ?? '');
  }, [activeProfile, editing]);

  useEffect(() => {
    if (editing) setSaveMessage(null);
  }, [editing]);

  const handleEdit = useCallback(() => {
    if (!activeProfile) return;
    setName(activeProfile.name ?? '');
    setEmail(activeProfile.email ?? '');
    setSaveMessage(null);
    setEditing(true);
  }, [activeProfile]);

  const handleModeToggle = useCallback(() => {
    const nextMode = profileMode === 'organizer' ? 'member' : 'organizer';
    setProfileMode(nextMode);
    nextMode === 'organizer' ? switchToOrganizer() : switchToMember();
  }, [profileMode, switchToMember, switchToOrganizer]);

  const handleLogout = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      clearBookings();
      await clearProfile();
      await logout();
    } finally {
      setLoading(false);
    }
  }, [clearBookings, clearProfile, loading, logout]);

  const handleSave = useCallback(async () => {
    if (!activeProfile?.id) return;
    const nextName = name.trim();
    const nextEmail = email.trim().toLowerCase();
    if (!nextName || !nextEmail) {
      Alert.alert('Profile incomplete', 'Name and email are required.');
      return;
    }
    setSaveMessage(null);
    setSaving(true);
    try {
      const updatedProfile: Profile = { ...activeProfile, name: nextName, email: nextEmail };
      await setDoc(
        doc(db, 'users', updatedProfile.id),
        { name: updatedProfile.name, email: updatedProfile.email, role: updatedProfile.role },
        { merge: true },
      );
      await hydrateCurrentUser(updatedProfile);
      if (authUser) {
        await setAuthUser({
          ...authUser,
          uid: updatedProfile.id,
          email: updatedProfile.email,
          role: updatedProfile.role,
          name: updatedProfile.name,
        });
      }
      setEditing(false);
      setSaveMessage('Profile updated successfully.');
    } catch {
      Alert.alert('Update failed', 'Please try again in a moment.');
      setSaveMessage(null);
    } finally {
      setSaving(false);
    }
  }, [activeProfile, authUser, hydrateCurrentUser, name, email, setAuthUser]);

  const displayLoading = profileLoading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          {/* UI: hero banner with subtle gradient and avatar */}
          <View style={styles.cover}>
            <View style={styles.coverAccent} />
            <View style={styles.coverContent}>
              <View style={styles.avatarWrap}>
                <Avatar name={activeProfile?.name ?? activeProfile?.email ?? 'Yellow Club'} size={72} />
                <View style={styles.avatarBadge}>
                  <Ionicons
                    name={profileMode === 'organizer' ? 'ribbon' : 'sparkles'}
                    size={16}
                    color="#1A1A1A"
                  />
                </View>
              </View>
              <View style={styles.coverText}>
                <Text style={styles.coverTitle}>
                  {activeProfile?.name || activeProfile?.email || 'Yellow Club Member'}
                </Text>
                <Text style={styles.coverSubtitle}>
                  {profileMode === 'organizer'
                    ? 'Leading experiences for fellow members'
                    : 'Joining curated conversations to grow'}
                </Text>
              </View>
            </View>
          </View>

          {/* UI: quick stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Role</Text>
              <Text style={styles.statValue}>{profileMode === 'organizer' ? 'Organizer' : 'Member'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={styles.statValue}>{DEMO_AUTH ? 'Demo Mode' : 'Live'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Focus</Text>
              <Text style={styles.statValue}>{profileMode === 'organizer' ? 'Hosting' : 'Learning'}</Text>
            </View>
          </View>

          {/* UI: polished mode toggle pill */}
          {canSwitchRole && (
            <Pressable
              style={({ pressed }) => [
                styles.modeToggle,
                pressed && styles.modeTogglePressed,
              ]}
              onPress={handleModeToggle}
            >
              <Ionicons
                name={profileMode === 'organizer' ? 'briefcase-outline' : 'people-outline'}
                size={18}
                color="#1A1A1A"
              />
              <Text style={styles.modeToggleText}>
                {profileMode === 'organizer' ? 'Switch to Member Mode' : 'Switch to Organizer Mode'}
              </Text>
            </Pressable>
          )}

          {profileMode === 'organizer' && (
            <View style={styles.organizerPill}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.organizerPillText}>Organizer Mode</Text>
            </View>
          )}

          {displayLoading && !activeProfile ? <ActivityIndicator color="#1A1A1A" /> : null}

          {activeProfile && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Account details</Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Name</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    editable={canEdit}
                    autoCorrect={false}
                    placeholder="Name"
                    placeholderTextColor="#999999"
                    returnKeyType="next"
                  />
                ) : (
                  <Text style={styles.value}>{activeProfile.name ?? '—'}</Text>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    editable={canEdit}
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="Email"
                    placeholderTextColor="#999999"
                    returnKeyType="done"
                  />
                ) : (
                  <Text style={styles.value}>{activeProfile.email ?? '—'}</Text>
                )}
              </View>

              {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
            </View>
          )}

          {/* UI: quick actions grid (visual only) */}
          <View style={styles.quickActions}>
            <View style={styles.quickAction}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#1A1A1A" />
              <Text style={styles.quickActionTitle}>Privacy & security</Text>
              <Text style={styles.quickActionSubtitle}>Control visibility and alerts</Text>
            </View>
            <View style={styles.quickAction}>
              <Ionicons name="notifications-outline" size={20} color="#1A1A1A" />
              <Text style={styles.quickActionTitle}>Notifications</Text>
              <Text style={styles.quickActionSubtitle}>Stay in sync with RSVP updates</Text>
            </View>
          </View>

          {canEdit && (
            editing ? (
              <Pressable style={[styles.primaryAction, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#1A1A1A" /> : <Text style={styles.primaryActionText}>Save changes</Text>}
              </Pressable>
            ) : (
              <Pressable style={styles.secondaryAction} onPress={handleEdit}>
                <Text style={styles.secondaryActionText}>Edit profile</Text>
              </Pressable>
            )
          )}

          {canEdit && (
            <Pressable
              style={({ pressed }) => [
                styles.logout,
                pressed && styles.logoutPressed,
              ]}
              onPress={loading ? undefined : handleLogout}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFD700" /> : (
                <>
                  <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.logoutText}>Logout</Text>
                </>
              )}
            </Pressable>
          )}

          {saveMessage && !editing ? <Text style={styles.successText}>{saveMessage}</Text> : null}

          {/* UI: settings footer */}
          <View style={styles.settingsList}>
            <View style={styles.settingsItem}>
              <Text style={styles.settingsTitle}>Support</Text>
              <Ionicons name="chevron-forward" size={18} color="#999999" />
            </View>
            <View style={styles.settingsItem}>
              <Text style={styles.settingsTitle}>Terms & privacy</Text>
              <Ionicons name="chevron-forward" size={18} color="#999999" />
            </View>
            <View style={styles.settingsItem}>
              <Text style={styles.settingsTitle}>Yellow Club guide</Text>
              <Ionicons name="chevron-forward" size={18} color="#999999" />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Yellow Club • Demo build</Text>
            <Text style={styles.footerText}>Version 0.1.0</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		paddingBottom: 40,
	},
	cover: {
		backgroundColor: '#F8F9FA',
		paddingHorizontal: 20,
		paddingTop: 32,
		paddingBottom: 40,
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
	},
	coverAccent: {
		position: 'absolute',
		top: -120,
		right: -40,
		width: 180,
		height: 180,
		borderRadius: 90,
		backgroundColor: '#FFF4C2',
		opacity: 0.35,
	},
	coverContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	avatarWrap: {
		position: 'relative',
	},
	avatar: {
		width: 72,
		height: 72,
		borderRadius: 36,
		borderWidth: 3,
		borderColor: '#FFFFFF',
	},
	avatarBadge: {
		position: 'absolute',
		right: -4,
		bottom: -2,
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: '#FFD700',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: '#FFFFFF',
	},
	coverText: {
		flex: 1,
	},
	coverTitle: {
		fontSize: 22,
		fontWeight: '700',
		color: '#1A1A1A',
	},
	coverSubtitle: {
		marginTop: 6,
		fontSize: 14,
		color: '#666666',
		lineHeight: 20,
	},
	statsRow: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		marginTop: -20,
		gap: 12,
	},
	statCard: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		shadowColor: '#000000',
		shadowOpacity: 0.08,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 2,
	},
	statLabel: {
		fontSize: 12,
		color: '#999999',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		marginBottom: 4,
	},
	statValue: {
		fontSize: 16,
		fontWeight: '700',
		color: '#1A1A1A',
	},
	modeToggle: {
		marginTop: 24,
		marginHorizontal: 20,
		height: 48,
		borderRadius: 12,
		backgroundColor: '#FFF5CC',
		borderWidth: 1,
		borderColor: '#FFE58F',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
	},
	modeTogglePressed: {
		transform: [{ scale: 0.98 }],
		opacity: 0.9,
	},
	modeToggleText: {
		fontSize: 15,
		fontWeight: '600',
		color: '#1A1A1A',
	},
	organizerPill: {
		marginTop: 12,
		alignSelf: 'center',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		backgroundColor: '#1A1A1A',
		paddingHorizontal: 16,
		paddingVertical: 6,
		borderRadius: 999,
	},
	organizerPillText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#FFD700',
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	infoCard: {
		marginTop: 28,
		marginHorizontal: 20,
		backgroundColor: '#F8F9FA',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		padding: 20,
		gap: 16,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#1A1A1A',
	},
	fieldGroup: {
		gap: 6,
	},
	label: {
		fontSize: 13,
		fontWeight: '600',
		color: '#666666',
	},
	value: {
		fontSize: 15,
		fontWeight: '600',
		color: '#1A1A1A',
	},
	input: {
		backgroundColor: '#FFFFFF',
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		paddingHorizontal: 14,
		paddingVertical: 10,
		fontSize: 15,
		fontWeight: '600',
		color: '#1A1A1A',
	},
	quickActions: {
		marginTop: 24,
		marginHorizontal: 20,
		flexDirection: 'row',
		gap: 12,
	},
	quickAction: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		padding: 16,
		gap: 8,
		shadowColor: '#000000',
		shadowOpacity: 0.06,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 1,
	},
	quickActionTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#1A1A1A',
	},
	quickActionSubtitle: {
		fontSize: 12,
		color: '#666666',
		lineHeight: 18,
	},
	primaryAction: {
		marginTop: 28,
		marginHorizontal: 20,
		height: 52,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFD700',
	},
	primaryActionText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#1A1A1A',
	},
	secondaryAction: {
		marginTop: 16,
		marginHorizontal: 20,
		height: 52,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: '#1A1A1A',
	},
	secondaryActionText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#1A1A1A',
	},
	logout: {
		marginTop: 24,
		marginHorizontal: 20,
		height: 48,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#1A1A1A',
		flexDirection: 'row',
		gap: 8,
	},
	logoutPressed: {
		transform: [{ scale: 0.98 }],
	},
	logoutText: {
		fontSize: 15,
		fontWeight: '600',
		color: '#FFFFFF',
	},
	successText: {
		marginTop: 16,
		textAlign: 'center',
		color: '#2E7D32',
		fontSize: 13,
		fontWeight: '600',
	},
	settingsList: {
		marginTop: 32,
		marginHorizontal: 20,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		overflow: 'hidden',
	},
	settingsItem: {
		paddingHorizontal: 18,
		paddingVertical: 16,
		backgroundColor: '#FFFFFF',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
	},
	settingsTitle: {
		fontSize: 15,
		fontWeight: '600',
		color: '#1A1A1A',
	},
	footer: {
		marginTop: 24,
		alignItems: 'center',
		gap: 4,
		paddingBottom: 16,
	},
	footerText: {
		fontSize: 12,
		color: '#999999',
	},
	errorText: {
		color: '#FF5252',
		fontSize: 12,
		marginTop: 6,
	},
	demoLabel: {
		fontSize: 12,
		color: '#999999',
		opacity: 0.6,
		marginTop: 12,
		textAlign: 'center',
	},
});
