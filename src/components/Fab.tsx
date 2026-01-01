import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface FabProps {
  onPress: () => void;
  style?: ViewStyle;
}

const Fab: React.FC<FabProps> = ({ onPress, style }) => (
  <TouchableOpacity
    style={[styles.fab, style]}
    onPress={onPress}
    activeOpacity={0.85}
    accessibilityLabel="Create Meetup"
  >
    <Icon name="plus" size={28} color="#000" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#F9D84A',
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default Fab;
