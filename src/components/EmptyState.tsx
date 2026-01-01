import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

type EmptyStateProps = {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onPress?: () => void;
  style?: ViewStyle;
};

const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, ctaLabel, onPress, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {ctaLabel && onPress ? (
        <Pressable
          style={({ pressed }) => [
            styles.cta,
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
          ]}
          onPress={onPress}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#FFF6C9',
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#3F3F3F',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  cta: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingHorizontal: 26,
    paddingVertical: 14,
  },
  ctaText: {
    color: '#FFD400',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default EmptyState;
