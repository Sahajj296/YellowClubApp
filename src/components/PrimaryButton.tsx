import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, disabled }) => {
  const handlePress = () => {
    if (disabled) return;
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled ? { opacity: 0.5 } : null]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFD600',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PrimaryButton;
