import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type BookingConfirmationParams = {
	BookingConfirmation: {
		title: string;
		date: string;
		location: string;
	};
};

type Props = NativeStackScreenProps<BookingConfirmationParams, 'BookingConfirmation'>;

export default function BookingConfirmationScreen({ navigation, route }: Props) {
	const { title, date, location } = route.params;
	const anim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(anim, {
			toValue: 1,
			duration: 120,
			useNativeDriver: true,
		}).start();
	}, [anim]);

	const goToBookings = () => {
		navigation.dispatch(
			CommonActions.navigate({
				name: 'MainTabs',
				params: { screen: 'Tabs', params: { screen: 'Bookings' } },
			}),
		);
	};

	const goToEvents = () => {
		navigation.dispatch(
			CommonActions.navigate({
				name: 'MainTabs',
				params: { screen: 'Tabs', params: { screen: 'Explore' } },
			}),
		);
	};

	return (
		<Animated.View
			style={[
				styles.container,
				{
					opacity: anim,
					transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
				},
			]}
		>
			<Text style={styles.heading}>Booking Confirmed</Text>
			<View style={styles.card}>
				<Text style={styles.title}>{title}</Text>
				<View style={styles.metaGroup}>
					<Text style={styles.date}>{date}</Text>
					<Text style={styles.location}>{location}</Text>
				</View>
				<TouchableOpacity style={styles.primaryButton} onPress={goToBookings}>
					<Text style={styles.primaryText}>View My Bookings</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.secondaryButton} onPress={goToEvents}>
					<Text style={styles.secondaryText}>Explore More Meetups</Text>
				</TouchableOpacity>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD400',
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    color: '#000',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFBEA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: '#000',
    marginBottom: 6,
  },
  metaGroup: {
    flexDirection: 'column',
    gap: 2,
    marginBottom: 10,
  },
  date: {
    fontSize: 14,
    color: '#000',
    opacity: 0.7,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#000',
    opacity: 0.7,
    marginBottom: 0,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#000',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  primaryText: {
    color: '#FFD400',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#000',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
