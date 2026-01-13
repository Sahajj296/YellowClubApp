import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, Animated, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useProfile } from '../context/ProfileContext';
import { useMeetups } from '../context/MeetupContext';
import EmptyState from '../components/EmptyState';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';
import { mapToDiscoveryMeetup } from '../utils/mapToDiscoveryMeetup';

export default function ExploreScreen() {
	const navigation = useNavigation<any>();
	const { currentUserProfile } = useProfile();
	const isOrganizer = currentUserProfile?.role === 'organizer';
	const { meetups, loading, refreshing, fetchMeetups, refreshMeetups } = useMeetups();
	const pulse = useRef(new Animated.Value(0.6)).current;
	const [showSkeleton, setShowSkeleton] = useState(true);

	const discoveryMeetups = useMemo(() => meetups.map(mapToDiscoveryMeetup), [meetups]);

	useFocusEffect(
		React.useCallback(() => {
			if (!meetups.length) {
				fetchMeetups();
			}
		}, [fetchMeetups, meetups.length]),
	);

	useEffect(() => {
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
				Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [pulse]);

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | null = null;
		if (loading) {
			setShowSkeleton(true);
		} else {
			timer = setTimeout(() => setShowSkeleton(false), 500);
		}
		return () => {
			if (timer) clearTimeout(timer);
		};
	}, [loading]);

	const handleCreateMeetup = () => navigation.navigate('CreateMeetup');

	const firstName = useMemo(() => {
		const raw = currentUserProfile?.name?.trim();
		if (!raw) return 'Guest';
		return raw.split(' ')[0];
	}, [currentUserProfile?.name]);

	const greetingTitle = useMemo(() => {
		const hour = new Date().getHours();
		if (hour < 12) return `Good morning, ${firstName}`;
		if (hour < 18) return `Good afternoon, ${firstName}`;
		return `Good evening, ${firstName}`;
	}, [firstName]);

	const greetingSubtitle = 'Discover curated Yellow Club meetups tailored for you.';

	const handleOpenMeetup = (meetupId: string) => {
		if (!meetupId) return;
		navigation.navigate('MeetupDetail', { meetupId });
	};

	if (showSkeleton) {
		return (
			<View style={styles.container}>
				<View style={styles.headerStack}>
					<View style={styles.greetingBlock}>
						<View style={styles.greetingShimmer} />
						<View style={styles.greetingShimmerShort} />
					</View>
					<View style={styles.searchSkeleton} />
					<View style={styles.heroSkeleton} />
				</View>
				<FlatList
					data={[0, 1, 2]}
					keyExtractor={item => `skeleton-${item}`}
					renderItem={() => (
						<View style={styles.cardWrapper}>
							<EventCardSkeleton />
						</View>
					)}
					contentContainerStyle={styles.listContent}
				/>
			</View>
		);
	}

	if (!loading && !discoveryMeetups.length) {
		return (
			<View style={styles.container}>
				<EmptyState
					title="No meetups yet"
					subtitle="It’s a little quiet right now. Refresh to sync the latest or host a standout Yellow Club moment."
					ctaLabel={isOrganizer ? 'Host a Meetup' : 'Refresh'}
					onPress={isOrganizer ? () => navigation.navigate('CreateMeetup') : refreshMeetups}
				/>
				{isOrganizer && (
					<Pressable style={styles.fab} onPress={handleCreateMeetup}>
						<Ionicons name="add" size={28} color="#FFD400" style={styles.fabIcon} />
					</Pressable>
				)}
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<FlatList
				data={discoveryMeetups}
				keyExtractor={item => item.id}
				contentContainerStyle={styles.listContent}
				ListHeaderComponent={
					<View style={styles.headerStack}>
						<View style={styles.greetingBlock}>
							<Text style={styles.greetingTitle}>{greetingTitle}</Text>
							<Text style={styles.greetingSubtitle}>{greetingSubtitle}</Text>
						</View>
						<View style={styles.searchBar}>
							<Ionicons name="search-outline" size={18} color="#666666" />
							<Text style={styles.searchPlaceholder}>Search meetups</Text>
						</View>
						<View style={styles.hero}>
							<Text style={styles.heroTitle}>Upcoming Meetups</Text>
							<Text style={styles.heroSubtitle}>
								Curated gatherings to help you connect, learn, and grow.
							</Text>
						</View>
					</View>
				}
				renderItem={({ item }) => {
					const sourceMeetup = meetups.find(original => original.id === item.id);
					if (!sourceMeetup) return null;
					return (
						<Pressable
							style={({ pressed }) => [styles.cardWrapper, pressed && styles.cardPressed]}
							onPress={() => handleOpenMeetup(sourceMeetup.id)}
						>
							<View pointerEvents="none">
								<EventCard meetup={sourceMeetup} />
							</View>
						</Pressable>
					);
				}}
				refreshing={refreshing}
				onRefresh={refreshMeetups}
			/>
			{isOrganizer && (
				<Pressable style={styles.fab} onPress={handleCreateMeetup}>
					<Ionicons name="add" size={28} color="#FFD400" style={styles.fabIcon} />
				</Pressable>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FAFAF7',
		paddingHorizontal: 16,
		paddingTop: 20,
	},
	listContent: {
		paddingBottom: 96,
		paddingTop: 8,
		gap: 20,
	},
	headerStack: {
		gap: 16,
		marginBottom: 0,
	},
	greetingBlock: {
		gap: 4,
	},
	greetingTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#1A365D',
	},
	greetingSubtitle: {
		fontSize: 14,
		color: '#6B6B6B',
	},
	searchBar: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F5F5F5',
		borderRadius: 12,
		paddingHorizontal: 14,
		height: 44,
	},
	searchPlaceholder: {
		marginLeft: 8,
		color: '#666666',
		fontSize: 14,
	},
	hero: {
		backgroundColor: '#FFFFFF',
		borderRadius: 18,
		paddingVertical: 18,
		paddingHorizontal: 20,
		marginBottom: 12,
		shadowColor: '#1A365D',
		shadowOpacity: 0.08,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 6 },
		elevation: 4,
	},
	heroTitle: {
		fontSize: 22,
		fontWeight: '700',
		color: '#1A365D',
		marginBottom: 8,
	},
	heroSubtitle: {
		fontSize: 14,
		lineHeight: 20,
		color: '#6B6B6B',
	},
	cardWrapper: {
		borderRadius: 16,
	},
	cardPressed: {
		transform: [{ scale: 0.98 }],
		opacity: 0.94,
	},
	greetingShimmer: {
		height: 18,
		width: 180,
		borderRadius: 8,
		backgroundColor: '#EAEAEA',
	},
	greetingShimmerShort: {
		height: 14,
		width: 120,
		borderRadius: 6,
		backgroundColor: '#EFEFEF',
	},
	searchSkeleton: {
		height: 44,
		borderRadius: 12,
		backgroundColor: '#F1F1F1',
	},
	heroSkeleton: {
		height: 120,
		borderRadius: 16,
		backgroundColor: '#F2F2F2',
	},
	fab: {
		position: 'absolute',
		right: 20,
		bottom: 32,
		height: 56,
		width: 56,
		borderRadius: 28,
		backgroundColor: '#1A365D',
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 6,
	},
	fabIcon: {
		marginBottom: 2,
		color: '#FFD54F',
	},
});
