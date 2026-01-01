import React, { useState, useMemo } from 'react';
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

export default function LoginScreen() {
  const { setAuthUser } = useAuth();
  const { hydrateCurrentUser, clearViewedProfile } = useProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0,
    [email, password]
  );
  const isDisabled = loading || !canSubmit;

  const onLogin = async () => {
    if (isDisabled) return;
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
          { merge: true }
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
    } catch (error) {
      Alert.alert('Login failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#555"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#555"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Text style={styles.helperText}>
        Enter your email and password to continue
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          (pressed && !isDisabled) && { opacity: 0.85, transform: [{ scale: 0.98 }] },
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
    backgroundColor: '#FFD400',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  helperText: {
    marginBottom: 16,
    fontSize: 13,
    color: '#444',
    opacity: 0.75,
  },
  buttonText: {
    color: '#FFD400',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
