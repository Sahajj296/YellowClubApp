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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMeetups } from '../context/MeetupContext';
import { useBookings } from '../store/BookingContext';
import { useProfile } from '../context/ProfileContext';
import { Meetup } from '../services/api/meetups';

type MeetupDetailParams = {
	MeetupDetail: { meetup: Meetup };
	BookingConfirmation: { title: string; date: string; location: string };
	MainTabs: {
		screen: 'Tabs';
		params: { screen: 'Profile'; params: { hostId?: string } };
	};
};

type Props = NativeStackScreenProps<MeetupDetailParams, 'MeetupDetail'>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function MeetupDetailScreen({ navigation, route }: Props) {
	const initialMeetup = route.params?.meetup;
	const { meetups, joinMeetup, isJoined } = useMeetups();
	const { addBooking } = useBookings();
	const { currentUserProfile } = useProfile();
	const [joining, setJoining] = useState(false);
	const ctaScale = useRef(new Animated.Value(1)).current;
	const [ctaPressed, setCtaPressed] = useState(false);

	const meetup = useMemo(() => {
		if (!initialMeetup?.id) {
			return initialMeetup;
		}
		return meetups.find(item => item.id === initialMeetup.id) ?? initialMeetup;
	}, [initialMeetup, meetups]);

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
	const capacityReached =
		(meetup?.participants?.length ?? 0) >= (meetup?.maxParticipants ?? 0);
	const isOrganizer = organizerIdentifiers.some(id => meetup?.organizerId === id);
	const ctaDisabled = alreadyJoined || capacityReached || isOrganizer || joining;

	const ctaLabel = alreadyJoined
		? 'Already Joined'
		: capacityReached
		? 'Capacity Reached'
		: isOrganizer
		? 'You are hosting'
		: 'Join Meetup';

	const handleHostPress = () => {
		if (!meetup?.organizerId) {
			return;
		}

		navigation.navigate('MainTabs', {
			screen: 'Tabs',
			params: {
				screen: 'Profile',
				params: { hostId: meetup.organizerId },
			},
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

	const handleJoin = async () => {
		if (!meetup?.id || ctaDisabled) {
			return;
		}
		setJoining(true);
		try {
			await joinMeetup(meetup.id);
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

	if (!meetup) {
		return (
			<View style={styles.fallback}>
				<Text style={styles.fallbackText}>We could not find this meetup.</Text>
			</View>
		);
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<View style={styles.card}>
				<Text style={styles.title}>{meetup.title}</Text>
				<View style={styles.metaGroup}>
					<Text style={styles.meta}>{meetup.date}</Text>
					<Text style={styles.meta}>{meetup.area}</Text>
				</View>
				<Pressable style={styles.hostRow} onPress={handleHostPress}>
					<View style={styles.hostInfo}>
						<Text style={styles.hostLabel}>Hosted by</Text>
						<Text style={styles.hostName}>{meetup.organizerName}</Text>
					</View>
					<Text style={styles.profileLink}>View profile</Text>
				</Pressable>
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Capacity</Text>
					<Text style={styles.sectionSubtitle}>
						{(meetup.participants?.length ?? 0)} / {meetup.maxParticipants} members
					</Text>
				</View>
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Participants</Text>
					{participants.length ? (
						participants.map(name => (
							<Text key={`${meetup.id}-${name}`} style={styles.participant}>
								• {name}
							</Text>
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
						<ActivityIndicator color="#FFD400" />
					) : (
						<Text style={[styles.ctaText, ctaDisabled && styles.ctaTextDisabled]}>
							{ctaLabel}
						</Text>
					)}
				</AnimatedPressable>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		backgroundColor: '#FFD600',
		padding: 20,
	},
	card: {
		backgroundColor: '#FFFBEA',
		borderRadius: 16,
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: '#000',
		marginBottom: 12,
	},
	metaGroup: {
		marginBottom: 16,
	},
	meta: {
		fontSize: 15,
		color: '#404040',
		marginBottom: 4,
	},
	hostRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	hostInfo: {
		flexShrink: 1,
	},
	hostLabel: {
		fontSize: 12,
		color: '#6A6A6A',
		marginBottom: 4,
	},
	hostName: {
		fontSize: 16,
		fontWeight: '600',
		color: '#000',
	},
	profileLink: {
		fontSize: 13,
		fontWeight: '600',
		color: '#000',
		textDecorationLine: 'underline',
	},
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#000',
		marginBottom: 6,
	},
	sectionSubtitle: {
		fontSize: 14,
		color: '#4A4A4A',
	},
	participant: {
		fontSize: 14,
		color: '#000',
		marginBottom: 4,
	},
	description: {
		fontSize: 14,
		color: '#333',
		lineHeight: 22,
	},
	cta: {
		marginTop: 12,
		backgroundColor: '#000',
		borderRadius: 12,
		height: 48,
		alignItems: 'center',
		justifyContent: 'center',
	},
	ctaDisabled: {
		backgroundColor: '#C4C4C4',
	},
	ctaPressed: {
		shadowColor: '#000',
		shadowOpacity: 0.18,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 6,
	},
	ctaText: {
		color: '#FFD400',
		fontSize: 16,
		fontWeight: '600',
	},
	ctaTextDisabled: {
		color: '#4A4A4A',
	},
	fallback: {
		flex: 1,
		backgroundColor: '#FFD600',
		justifyContent: 'center',
		alignItems: 'center',
	},
	fallbackText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#000',
	},
});
