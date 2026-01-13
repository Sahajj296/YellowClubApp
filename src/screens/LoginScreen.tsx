import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { db } from '../services/firebase';
import { trackEvent } from '../services/analytics';
import { DEMO_AUTH } from '../config/env';

export default function LoginScreen() {
  const { setAuthUser } = useAuth();
  const { hydrateCurrentUser, clearViewedProfile } = useProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0,
    [email, password],
  );
  const isDisabled = DEMO_AUTH ? false : loading || !canSubmit;
  const autoLoginRef = useRef(false);
  const demoAuthUser = useMemo(
    () => ({
      uid: 'demo-user-001',
      email: 'demo@yellowclub.app',
      role: 'user' as const,
      name: 'Demo User',
    }),
    [],
  );

  const onLogin = useCallback(async () => {
    if (loading) return;

    if (DEMO_AUTH) {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();
      if (!trimmedEmail || !trimmedPassword) {
        return;
      }
      setLoading(true);
      try {
        const derivedName = trimmedEmail.split('@')[0] ?? trimmedEmail;
        const sessionUser = {
          uid: trimmedEmail,
          email: trimmedEmail,
          role: 'user' as const,
          name: derivedName,
        };

        await setAuthUser(sessionUser);
        await hydrateCurrentUser({
          id: sessionUser.uid,
          email: sessionUser.email,
          name: sessionUser.name,
          role: 'user',
        });
        clearViewedProfile();
        trackEvent('login_success');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (loading || !canSubmit) return;
    setLoading(true);
    try {
      const userId = email.trim().toLowerCase();
      const userRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userRef);
      let role: 'user' | 'organizer' = 'user';
      let name = userId.split('@')[0] ?? '';
      if (snapshot.exists()) {
        const data = snapshot.data() ?? {};
        role = data.role === 'organizer' ? 'organizer' : 'user';
        name = data.name ?? name;
      } else {
        await setDoc(
          userRef,
          { email: userId, name, role },
          { merge: true },
        );
      }
      const profile = { id: userId, email: userId, name, role };
      await setAuthUser({
        uid: profile.id,
        email: profile.email,
        role: profile.role,
        name: profile.name,
      });
      await hydrateCurrentUser(profile);
      clearViewedProfile();
      trackEvent('login_success');
    } catch (error) {
      Alert.alert('Login failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    canSubmit,
    clearViewedProfile,
    demoAuthUser,
    email,
    hydrateCurrentUser,
    loading,
    setAuthUser,
  ]);

  useEffect(() => {
    if (!DEMO_AUTH || autoLoginRef.current) {
      return;
    }
    autoLoginRef.current = true;
    onLogin();
  }, [onLogin]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        cursorColor="#000"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        cursorColor="#000"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Text style={styles.helperText}>
        Enter your email and password to continue
      </Text>
      {DEMO_AUTH ? (
        <Text style={styles.demoCaption}>
          Demo Environment – Authentication disabled
        </Text>
      ) : (
        <Text style={styles.demoCaption}>Demo Environment</Text>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          !isDisabled && pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          isDisabled && styles.buttonDisabled,
        ]}
        onPress={isDisabled ? undefined : onLogin}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator color="#FFD400" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A365D',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    color: '#2C2C2C',
    borderWidth: 1,
    borderColor: '#E8E8E3',
  },
  button: {
    backgroundColor: '#FFC107',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  helperText: {
    marginBottom: 6,
    fontSize: 13,
    color: '#6B6B6B',
  },
  demoCaption: {
    marginBottom: 16,
    fontSize: 12,
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  buttonText: {
    color: '#2C2C2C',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
