import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

type HostProfileParams = {
  HostProfile: {
    name: string;
    email?: string;
  };
};

type HostRouteProp = RouteProp<HostProfileParams, 'HostProfile'>;

export default function HostProfileScreen() {
	const navigation = useNavigation<any>();
	const route = useRoute<HostRouteProp>();
	const params = route.params;
	const name = params?.name;
	const email = params?.email;

	if (!name && !email) {
		return (
			<View style={styles.fallback}>
				<Text style={styles.fallbackText}>This profile is unavailable right now.</Text>
				<Pressable style={styles.backButton} onPress={navigation.goBack}>
					<Text style={styles.backLabel}>Back</Text>
				</Pressable>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
				<View style={styles.container}>
					<Pressable style={styles.backButton} onPress={navigation.goBack}>
						<Text style={styles.backLabel}>Back</Text>
					</Pressable>
					<Text style={styles.banner}>Viewing host profile</Text>
					<View style={styles.infoBox}>
						<Text style={styles.label}>Name</Text>
						<Text style={styles.value}>{name ?? 'Not provided'}</Text>
						<Text style={styles.label}>Email</Text>
						<Text style={styles.value}>{email ?? 'Not provided'}</Text>
					</View>
					<Text style={styles.helperText}>Host profiles are read-only in demo mode.</Text>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1A365D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  backLabel: {
    marginLeft: 8,
    color: '#FFD54F',
    fontWeight: '600',
  },
  banner: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 18,
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1A365D',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  label: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 4,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#2C2C2C',
    fontWeight: '700',
    marginBottom: 16,
  },
  helperText: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAF7',
  },
  fallbackText: {
    fontSize: 16,
    color: '#2C2C2C',
    textAlign: 'center',
  },
});
