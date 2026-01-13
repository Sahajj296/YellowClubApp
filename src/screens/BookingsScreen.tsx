import React, { useRef, useEffect, useMemo } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	Pressable,
	Animated,
	Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useBookings } from '../store/BookingContext';
import { useMeetups } from '../context/MeetupContext';

export default function BookingsScreen() {
	const { bookings } = useBookings();
	const { myMeetups } = useMeetups();
	const navigation = useNavigation<any>();
	const anim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(anim, {
			toValue: 1,
			duration: 140,
			useNativeDriver: true,
		}).start();
	}, [anim]);

	const combined = useMemo(() => {
		const map = new Map<
			string,
			{ id: string; title: string; date: string; location: string }
		>();
		myMeetups.forEach(meetup => {
			if (meetup.id) {
				map.set(meetup.id, {
					id: meetup.id,
					title: meetup.title,
					date: meetup.date,
					location: meetup.area,
				});
			}
		});
		bookings.forEach(booking => {
			if (booking?.id && !map.has(booking.id)) {
				map.set(booking.id, booking);
			}
		});
		return Array.from(map.values());
	}, [myMeetups, bookings]);

	if (combined.length === 0) {
		return (
			<Animated.View
				style={[
					styles.container,
					{
						opacity: anim,
						transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
					},
				]}
			>
				<View style={styles.emptyCard}>
					<Image
						source={{ uri: 'https://source.unsplash.com/200x200/?conversation' }}
						style={styles.emptyArtwork}
					/>
					<Text style={styles.emptyTitle}>Your meetup roster is waiting.</Text>
					<Text style={styles.emptySubtitle}>
						Discover curated Yellow Club sessions and reserve your seat in seconds.
					</Text>
					<Pressable
						style={({ pressed }) => [
							styles.primaryButton,
							pressed && styles.primaryButtonPressed,
						]}
						onPress={() =>
							navigation.dispatch(
								CommonActions.navigate({
									name: 'MainTabs',
									params: { screen: 'Tabs', params: { screen: 'Explore' } },
								}),
							)
						}
					>
						<Text style={styles.primaryText}>Explore Meetups</Text>
					</Pressable>
				</View>
			</Animated.View>
		);
	}

	return (
		<Animated.View
			style={[
				styles.container,
				{
					opacity: anim,
					transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
				},
			]}
		>
			{/* UI: elevated header with joined count */}
			<View style={styles.header}>
				<View>
					<Text style={styles.headerTitle}>My Meetups</Text>
					<Text style={styles.headerSubtitle}>You’re confirmed for {combined.length} upcoming sessions</Text>
				</View>
				<View style={styles.segments}>
					<View style={[styles.segmentPill, styles.segmentActive]}>
						<Text style={[styles.segmentText, styles.segmentTextActive]}>Joined</Text>
					</View>
					<View style={styles.segmentPill}>
						<Text style={styles.segmentText}>Hosted</Text>
					</View>
				</View>
			</View>

			<FlatList
				data={combined}
				keyExtractor={item => item.id}
				contentContainerStyle={styles.listContent}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				renderItem={({ item }) => (
					<Pressable
						style={styles.card}
						onPress={() => navigation.navigate('MeetupDetails', { meetup: item })}
					>
						<View style={styles.cardHeader}>
							<View style={styles.cardTitleWrap}>
								<Ionicons name="sparkles-outline" size={18} color="#FFD700" />
								<Text style={styles.cardTitle} numberOfLines={1}>
									{item.title}
								</Text>
							</View>
							<View style={styles.statusBadge}>
								<Text style={styles.statusText}>Confirmed</Text>
							</View>
						</View>
						<View style={styles.metaRow}>
							<Ionicons name="calendar-outline" size={16} color="#666666" />
							<Text style={styles.metaText}>{item.date}</Text>
						</View>
						<View style={styles.metaRow}>
							<Ionicons name="location-outline" size={16} color="#666666" />
							<Text style={styles.metaText} numberOfLines={1}>
								{item.location}
							</Text>
						</View>
						<View style={styles.cardFooter}>
							<View style={styles.pill}>
								<Ionicons name="person-outline" size={14} color="#1A1A1A" />
								<Text style={styles.pillText}>You’re attending</Text>
							</View>
							<Text style={styles.footerHint}>Tap to view details</Text>
						</View>
					</Pressable>
				)}
			/>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 16,
		paddingTop: 20,
	},
	header: {
		marginBottom: 16,
		gap: 16,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#1A1A1A',
	},
	headerSubtitle: {
		fontSize: 14,
		color: '#666666',
		marginTop: 4,
	},
	segments: {
		flexDirection: 'row',
		backgroundColor: '#F4F4F6',
		borderRadius: 12,
		padding: 4,
		gap: 4,
		alignSelf: 'flex-start',
	},
	segmentPill: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 10,
	},
	segmentActive: {
		backgroundColor: '#FFFFFF',
		shadowColor: '#000000',
		shadowOpacity: 0.1,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 2 },
	},
	segmentText: {
		fontSize: 13,
		fontWeight: '600',
		color: '#666666',
	},
	segmentTextActive: {
		color: '#1A1A1A',
	},
	listContent: {
		paddingBottom: 40,
	},
	separator: {
		height: 12,
	},
	card: {
		backgroundColor: '#F8F9FA',
		borderRadius: 16,
		padding: 18,
		shadowColor: '#000000',
		shadowOpacity: 0.08,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 2,
		gap: 10,
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	cardTitleWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		flex: 1,
		paddingRight: 12,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#1A1A1A',
	},
	statusBadge: {
		backgroundColor: '#EAF7ED',
		borderRadius: 16,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	statusText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#2E7D32',
	},
	metaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	metaText: {
		fontSize: 13,
		color: '#666666',
	},
	cardFooter: {
		marginTop: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		backgroundColor: '#FFFFFF',
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	pillText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#1A1A1A',
	},
	footerHint: {
		fontSize: 12,
		color: '#999999',
	},
	emptyCard: {
		marginTop: 48,
		borderRadius: 20,
		padding: 24,
		backgroundColor: '#F8F9FA',
		alignItems: 'center',
		gap: 16,
	},
	emptyArtwork: {
		width: 120,
		height: 120,
		borderRadius: 16,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#1A1A1A',
		textAlign: 'center',
	},
	emptySubtitle: {
		fontSize: 14,
		color: '#666666',
		textAlign: 'center',
		lineHeight: 20,
	},
	primaryButton: {
		marginTop: 4,
		width: '100%',
		height: 48,
		borderRadius: 12,
		backgroundColor: '#FFD700',
		alignItems: 'center',
		justifyContent: 'center',
	},
	primaryButtonPressed: {
		transform: [{ scale: 0.98 }],
		opacity: 0.9,
	},
	primaryText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1A1A1A',
	},
});