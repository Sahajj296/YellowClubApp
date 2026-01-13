import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PrimaryButton from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { currentUserProfile } = useProfile();
  const isHost = currentUserProfile?.role === 'organizer';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yellow Club</Text>
      <Text style={styles.subtitle}>Home Screen</Text>
      <View style={styles.buttonContainer}>
        <PrimaryButton title="Get Started" onPress={() => navigation.navigate('Login')} />
      </View>
      {isHost && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateMeetup')}
        >
          <Text style={styles.fabText}>Create Meetup</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    color: '#595959',
  },
  buttonContainer: {
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#111111',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    elevation: 4,
  },
  fabText: {
    color: '#FFD400',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default HomeScreen;
