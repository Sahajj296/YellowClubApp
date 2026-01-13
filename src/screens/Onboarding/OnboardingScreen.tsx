import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.heroAccent} />
      <Text style={styles.title}>Welcome to Yellow Club 🚀</Text>
      <Text style={styles.subtitle}>
        Meet. Connect. Grow.
      </Text>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heroAccent: {
    alignSelf: 'flex-start',
    width: 56,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#FFD400',
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1D1D1F',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
    color: '#4A4A4A',
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
