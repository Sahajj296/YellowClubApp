import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	View,
	Pressable,
	Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
	NavigationProp as RNNavigationProp,
	ParamListBase,
	useNavigation,
	useRoute,
	RouteProp,
} from '@react-navigation/native';
import { useMeetups } from '../context/MeetupContext';
import { useBookings } from '../store/BookingContext';
import { useProfile } from '../context/ProfileContext';
import { trackEvent } from '../services/analytics';
import { formatMeetupDate } from '../utils/formatMeetupDate';
import type { ExploreStackParamList } from '../navigation/ExploreStackNavigator';
import Avatar from '../components/Avatar';

type BookingConfirmationParams = {
	title: string;
	date: string;
	location: string;
};

type MeetupDetailNavParamList = ExploreStackParamList & {
	BookingConfirmation: BookingConfirmationParams;
};

type MeetupDetailNavigation = RNNavigationProp<MeetupDetailNavParamList>;
type RouteProps = RouteProp<MeetupDetailNavParamList, 'MeetupDetail'>;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function MeetupDetailScreen() {
	const navigation = useNavigation<MeetupDetailNavigation>();
	const route = useRoute<RouteProps>();
	const { meetupId } = route.params;
	const { meetups, joinMeetup, isJoined, loading } = useMeetups();
	const { addBooking } = useBookings();
	const { currentUserProfile } = useProfile();
	const [joining, setJoining] = useState(false);
	const [showAllParticipants, setShowAllParticipants] = useState(false);
	const ctaScale = useRef(new Animated.Value(1)).current;
	const [ctaPressed, setCtaPressed] = useState(false);
	const viewTrackedRef = useRef<string | null>(null);

	const meetup = useMemo(() => meetups.find(item => item.id === meetupId), [meetups, meetupId]);
	const formattedDate = formatMeetupDate(meetup?.date);

	const participants = useMemo(
		() => meetup?.participants?.map(participant => participant.name) ?? [],
		[meetup?.participants],
	);

	const organizerIdentifiers = useMemo(
		() =>
			[currentUserProfile?.id, currentUserProfile?.email].filter(
				(value): value is string => Boolean(value),
			),
		[currentUserProfile],
	);
	const alreadyJoined = meetup?.id ? isJoined(meetup.id) : false;
	const totalParticipants = meetup?.participants?.length ?? 0;
	const maxParticipants =
		typeof meetup?.maxParticipants === 'number' && meetup.maxParticipants > 0
			? meetup.maxParticipants
			: null;
	const capacityReached = maxParticipants !== null && totalParticipants >= maxParticipants;
	const isOrganizer = organizerIdentifiers.some(id => meetup?.organizerId === id);
	const ctaDisabled = alreadyJoined || capacityReached || isOrganizer || joining;

	const ctaLabel = alreadyJoined
		? 'Already Joined'
		: capacityReached
		? 'Capacity Reached'
		: isOrganizer
		? 'You are hosting'
		: 'Join Meetup';

	const capacityRatio =
		maxParticipants !== null && maxParticipants > 0 ? Math.min(totalParticipants / maxParticipants, 1) : 0;
	const capacityColor =
		capacityRatio >= 1 ? '#FF5252' : capacityRatio >= 0.5 ? '#FFC107' : '#4CAF50';

	const handleHostPress = () => {
		if (!meetup) return;
		const source: any = meetup;
		const parentNav = navigation.getParent<RNNavigationProp<ParamListBase>>();
		parentNav?.navigate('HostProfile', {
			name: meetup.organizerName ?? meetup.organizerId ?? 'Host',
			email: source?.organizerEmail ?? source?.email ?? undefined,
		});
	};

	const prevJoinedRef = useRef(alreadyJoined);

	useEffect(() => {
		if (alreadyJoined && !prevJoinedRef.current) {
			Animated.sequence([
				Animated.timing(ctaScale, { toValue: 1.05, duration: 160, useNativeDriver: true }),
				Animated.timing(ctaScale, { toValue: 1, duration: 180, useNativeDriver: true }),
			]).start();
		}
		prevJoinedRef.current = alreadyJoined;
	}, [alreadyJoined, ctaScale]);

	useEffect(() => {
		if (meetup?.id && viewTrackedRef.current !== meetup.id) {
			viewTrackedRef.current = meetup.id;
			trackEvent('view_meetup', {
				meetup_id: meetup.id,
				source: meetup.source,
			});
		}
	}, [meetup]);

	const handleJoin = async () => {
		if (!meetup?.id || ctaDisabled) {
			return;
		}
		setJoining(true);
		try {
			await joinMeetup(meetup.id);
			trackEvent('join_meetup', {
				meetup_id: meetup.id,
				source: meetup.source,
			});
			addBooking({
				id: meetup.id,
				title: meetup.title,
				date: meetup.date,
				location: meetup.area,
			});
			navigation.navigate('BookingConfirmation', {
				title: meetup.title,
				date: meetup.date,
				location: meetup.area,
			});
		} catch (error: any) {
			const message =
				error?.message === 'PROFILE_NOT_READY'
					? 'Add your name and email in Profile before joining a meetup.'
					: 'Please try again in a moment.';
			Alert.alert('Unable to join', message);
		} finally {
			setJoining(false);
		}
	};

	const handleCtaPressIn = () => {
		if (ctaDisabled) return;
		setCtaPressed(true);
		Animated.timing(ctaScale, { toValue: 0.96, duration: 140, useNativeDriver: true }).start();
	};

	const handleCtaPressOut = () => {
		if (ctaDisabled) return;
		setCtaPressed(false);
		Animated.timing(ctaScale, { toValue: 1, duration: 160, useNativeDriver: true }).start();
	};

	const renderSkeleton = () => (
		<View style={styles.skeletonContainer}>
			<View style={styles.skeletonBlock} />
			<View style={styles.skeletonBlock} />
			<View style={styles.skeletonBlock} />
			<View style={styles.skeletonBlock} />
		</View>
	);

	if (loading && !meetup) {
		return (
			<ScrollView contentContainerStyle={styles.container}>
				<View style={styles.card}>{renderSkeleton()}</View>
			</ScrollView>
		);
	}

	if (!meetup) {
		return (
			<View style={styles.fallback}>
				<Text style={styles.fallbackText}>We could not find this meetup.</Text>
			</View>
		);
	}

	const displayParticipants = showAllParticipants ? participants : participants.slice(0, 3);

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<View style={styles.card}>
				<Text style={styles.title}>{meetup.title}</Text>

				<View style={styles.metaGroup}>
					<View style={styles.metaRow}>
						<Ionicons name='calendar-outline' size={16} color='#6B6B6B' style={styles.metaIcon} />
						<Text style={styles.meta}>{formattedDate}</Text>
					</View>
					<View style={styles.metaRow}>
						<Ionicons name='location-outline' size={16} color='#6B6B6B' style={styles.metaIcon} />
						<Text style={styles.meta}>{meetup.area}</Text>
					</View>
				</View>

				<View style={styles.hostRow}>
					<View style={styles.hostInfo}>
						<Avatar name={meetup.organizerName ?? 'Yellow Club Host'} size={56} />
						<View style={styles.hostMeta}>
							<Text style={styles.hostLabel}>Hosted by</Text>
							<Text style={styles.hostName}>{meetup.organizerName ?? 'Yellow Club Host'}</Text>
							<Text style={styles.hostStats}>Rating 4.8 • 12 meetups hosted</Text>
						</View>
					</View>
					<Pressable
						style={({ pressed }) => [styles.profileLink, pressed && styles.profileLinkPressed]}
						onPress={handleHostPress}
					>
						<Text style={styles.profileLinkText}>View profile</Text>
					</Pressable>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Capacity</Text>
					<Text style={styles.sectionSubtitle}>
						{totalParticipants}
						{maxParticipants !== null ? ` / ${maxParticipants}` : ''} confirmed
					</Text>
					<View style={styles.progressTrack}>
						<View style={[styles.progressFill, { width: `${capacityRatio * 100}%`, backgroundColor: capacityColor }]} />
					</View>
				</View>

				<View style={styles.avatarStack}>
					{participants.slice(0, 4).map((name, index) => (
						<Avatar
							key={`${meetup.id}-${name}-${index}`}
							name={name}
							size={32}
							style={{ marginLeft: index === 0 ? 0 : -10 }}
						/>
					))}
					{participants.length > 4 && (
						<View style={styles.avatarOverflow}>
							<Text style={styles.avatarOverflowText}>+{participants.length - 4}</Text>
						</View>
					)}
				</View>

				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Participants</Text>
						{participants.length > 3 && (
							<Pressable onPress={() => setShowAllParticipants(prev => !prev)}>
								<Text style={styles.toggleLink}>{showAllParticipants ? 'Show less' : 'Show all'}</Text>
							</Pressable>
						)}
					</View>
					{displayParticipants.length ? (
						displayParticipants.map(name => (
							<View key={`${meetup.id}-${name}`} style={styles.participantRow}>
								<View style={styles.participantDot} />
								<Text style={styles.participant}>{name}</Text>
							</View>
						))
					) : (
						<Text style={styles.sectionSubtitle}>Be the first to join.</Text>
					)}
				</View>

				{meetup.description ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>About</Text>
						<Text style={styles.description}>{meetup.description}</Text>
					</View>
				) : null}

				{alreadyJoined && (
					<Text style={styles.successNote}>You’re confirmed for this meetup. See you there!</Text>
				)}

				<AnimatedPressable
					style={[
						styles.cta,
						ctaDisabled && styles.ctaDisabled,
						{ transform: [{ scale: ctaScale }] },
						ctaPressed && styles.ctaPressed,
					]}
					onPress={handleJoin}
					disabled={ctaDisabled}
					onPressIn={handleCtaPressIn}
					onPressOut={handleCtaPressOut}
				>
					{joining ? (
						<ActivityIndicator color="#1A1A1A" />
					) : (
						<Text style={[styles.ctaText, ctaDisabled && styles.ctaTextDisabled]}>{ctaLabel}</Text>
					)}
				</AnimatedPressable>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		backgroundColor: '#FFFFFF',
		padding: 20,
	},
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		padding: 24,
		gap: 24,
		shadowColor: '#000000',
		shadowOpacity: 0.06,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 6 },
		elevation: 4,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111111',
	},
	metaGroup: {
		gap: 8,
	},
	metaRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	metaIcon: {
		marginRight: 8,
	},
	meta: {
		fontSize: 14,
		color: '#5F5F5F',
	},
	hostRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	hostInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
		flex: 1,
	},
	hostMeta: {
		gap: 4,
	},
	hostLabel: {
		fontSize: 12,
		color: '#8A8A8A',
		letterSpacing: 0.6,
		textTransform: 'uppercase',
	},
	hostName: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111111',
	},
	hostStats: {
		fontSize: 13,
		color: '#6B6B6B',
	},
	profileLink: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#1A1A1A',
	},
	profileLinkPressed: {
		opacity: 0.85,
	},
	profileLinkText: {
		fontSize: 13,
		fontWeight: '600',
		color: '#1A1A1A',
	},
	section: {
		gap: 10,
	},
	sectionTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#1E1E1E',
	},
	sectionSubtitle: {
		fontSize: 14,
		color: '#646464',
	},
	progressTrack: {
		height: 10,
		borderRadius: 6,
		backgroundColor: '#EAEAEA',
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		borderRadius: 6,
	},
	avatarStack: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	avatarOverflow: {
		marginLeft: -10,
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: '#FFFFFF',
	},
	avatarOverflowText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#FFFFFF',
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	toggleLink: {
		fontSize: 13,
		fontWeight: '600',
		color: '#1A1A1A',
	},
	participantRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	participantDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: '#FFD700',
	},
	participant: {
		fontSize: 14,
		color: '#000',
	},
	description: {
		fontSize: 14,
		color: '#3A3A3A',
		lineHeight: 22,
	},
	cta: {
		marginTop: 8,
		backgroundColor: '#FFD700',
		borderRadius: 12,
		height: 48,
		alignItems: 'center',
		justifyContent: 'center',
	},
	ctaDisabled: {
		backgroundColor: '#E2E2E2',
	},
	ctaPressed: {
		shadowColor: '#000',
		shadowOpacity: 0.18,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 6,
	},
	ctaText: {
		color: '#1A1A1A',
		fontSize: 16,
		fontWeight: '600',
	},
	ctaTextDisabled: {
		color: '#4A4A4A',
	},
	successNote: {
		fontSize: 13,
		color: '#1F5F3D',
		backgroundColor: '#E0F5E9',
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 12,
	},
	skeletonContainer: {
		gap: 16,
	},
	skeletonBlock: {
		height: 20,
		borderRadius: 12,
		backgroundColor: '#EEEEEE',
	},
	fallback: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
	},
	fallbackText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1E1E1E',
	},
});
