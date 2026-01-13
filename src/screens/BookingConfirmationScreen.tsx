import React, { useRef, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Animated,
	Image,
	ScrollView,
} from 'react-native';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { trackEvent } from '../services/analytics';
import { formatMeetupDate } from '../utils/formatMeetupDate';
import { CommonActions } from '@react-navigation/native';

type BookingConfirmationParams = {
	title: string;
	date: string;
	location: string;
};

export default function BookingConfirmationScreen() {
	const navigation = useNavigation();
	const route = useRoute<RouteProp<{ BookingConfirmation: BookingConfirmationParams }, 'BookingConfirmation'>>();
	const { title, date, location } = route.params;
	const prettyDate = formatMeetupDate(date);
	const anim = useRef(new Animated.Value(0)).current;
	const pulse = useRef(new Animated.Value(0)).current;
	const iconScale = useRef(new Animated.Value(0.6)).current;

	useEffect(() => {
		Animated.timing(anim, {
			toValue: 1,
			duration: 120,
			useNativeDriver: true,
		}).start();
	}, [anim]);

	useEffect(() => {
		Animated.parallel([
			Animated.timing(pulse, {
				toValue: 1,
				duration: 240,
				useNativeDriver: true,
			}),
			Animated.spring(iconScale, {
				toValue: 1,
				friction: 6,
				tension: 60,
				useNativeDriver: true,
			}),
		]).start();
	}, [pulse, iconScale]);

	useEffect(() => {
		trackEvent('booking_confirmed', { title });
	}, [title]);

	const goToBookings = () => {
		navigation.dispatch(
			CommonActions.reset({
				index: 0,
				routes: [
					{
						name: 'MainTabs',
						params: {
							screen: 'Tabs',
							params: {
								screen: 'Bookings',
							},
						},
					},
				],
			})
		);
	};

	const goToEvents = () => {
		navigation.dispatch(
			CommonActions.reset({
				index: 0,
				routes: [
					{
						name: 'MainTabs',
						params: {
							screen: 'Tabs',
							params: {
								screen: 'Explore',
							},
						},
					},
				],
			})
		);
	};

	return (
		<Animated.View
			style={[
				styles.container,
				{
					opacity: pulse,
					transform: [
						{
							translateY: pulse.interpolate({
								inputRange: [0, 1],
								outputRange: [18, 0],
							}),
						},
					],
				},
			]}
		>
			<ScrollView
				contentContainerStyle={styles.contentContainer}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.hero}>
					<Animated.View style={[styles.heroIcon, { transform: [{ scale: iconScale }] }]}>
						<Ionicons name="checkmark" size={36} color="#1A1A1A" />
					</Animated.View>
					<Text style={styles.heading}>Booking Confirmed</Text>
					<Text style={styles.subheading}>You’re all set for your upcoming meetup.</Text>
				</View>

				<View style={styles.summaryCard}>
					<Image
						source={{ uri: 'https://source.unsplash.com/600x300/?community' }}
						style={styles.summaryImage}
					/>
					<View style={styles.summaryContent}>
						<Text style={styles.eventTitle}>{title}</Text>
						<View style={styles.summaryRow}>
							<Ionicons name="calendar-outline" size={16} color="#666666" />
							<Text style={styles.summaryText}>{prettyDate}</Text>
						</View>
						<View style={styles.summaryRow}>
							<Ionicons name="location-outline" size={16} color="#666666" />
							<Text style={styles.summaryText}>{location}</Text>
						</View>
					</View>
				</View>

				<View style={styles.nextSection}>
					<Text style={styles.nextTitle}>What’s next?</Text>
					<View style={styles.nextRow}>
						<View style={styles.nextIcon}>
							<Ionicons name="chatbubbles-outline" size={18} color="#FFD700" />
						</View>
						<Text style={styles.nextText}>Introduce yourself in the meetup thread.</Text>
					</View>
					<View style={styles.nextRow}>
						<View style={styles.nextIcon}>
							<Ionicons name="bookmark-outline" size={18} color="#FFD700" />
						</View>
						<Text style={styles.nextText}>Add the event to your calendar.</Text>
					</View>
					<View style={styles.nextRow}>
						<View style={styles.nextIcon}>
							<Ionicons name="people-outline" size={18} color="#FFD700" />
						</View>
						<Text style={styles.nextText}>Invite a friend to join you.</Text>
					</View>
				</View>

				<View style={styles.actions}>
					<TouchableOpacity style={styles.primaryButton} onPress={goToBookings}>
						<Text style={styles.primaryText}>View My Meetups</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.secondaryButton} onPress={goToEvents}>
						<Text style={styles.secondaryText}>Explore More Meetups</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FAFAF7',
		paddingHorizontal: 20,
		paddingTop: 32,
	},
	contentContainer: {
		paddingBottom: 48,
	},
	hero: {
		alignItems: 'center',
		gap: 12,
		marginBottom: 24,
	},
	heroIcon: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: '#FFD700',
		alignItems: 'center',
		justifyContent: 'center',
	},
	heading: {
		fontSize: 24,
		fontWeight: '700',
		color: '#1A1A1A',
	},
	subheading: {
		fontSize: 14,
		color: '#666666',
	},
	summaryCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 18,
		overflow: 'hidden',
		marginBottom: 24,
		shadowColor: '#000000',
		shadowOpacity: 0.06,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 4 },
		elevation: 3,
	},
	summaryImage: {
		height: 140,
		width: '100%',
	},
	summaryContent: {
		padding: 16,
		gap: 10,
	},
	eventTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#1A1A1A',
	},
	summaryRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	summaryText: {
		fontSize: 14,
		color: '#666666',
	},
	nextSection: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 18,
		gap: 14,
		marginBottom: 24,
	},
	nextTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#1A1A1A',
	},
	nextRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	nextIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#FFF4C9',
		alignItems: 'center',
		justifyContent: 'center',
	},
	nextText: {
		fontSize: 14,
		color: '#555555',
	},
	actions: {
		marginTop: 24,
	},
	primaryButton: {
		height: 48,
		borderRadius: 12,
		backgroundColor: '#FFD700',
		alignItems: 'center',
		justifyContent: 'center',
	},
	primaryText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1A1A1A',
	},
	secondaryButton: {
		marginTop: 16,
		height: 48,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#FFD700',
		backgroundColor: '#FFFFFF',
		alignItems: 'center',
		justifyContent: 'center',
	},
	secondaryText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFD700',
	},
});
