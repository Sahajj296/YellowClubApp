// src/components/EventCard.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Platform, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatMeetupDate } from '../utils/formatMeetupDate';
import Avatar from './Avatar';
import MeetupCoverGradient from './MeetupCoverGradient';

type EventCardProps = {
	meetup: any;
};

const HERO_IMAGES = [
	'https://source.unsplash.com/800x400/?technology',
	'https://source.unsplash.com/800x400/?sustainability',
	'https://source.unsplash.com/800x400/?environment',
];

const EventCard = ({ meetup }: EventCardProps) => {
	const participantsJoined = meetup?.participants?.length ?? 0;
	const formattedDate = useMemo(() => formatMeetupDate(meetup.date), [meetup.date]);
	const percentage =
		meetup.maxParticipants > 0
			? (participantsJoined / meetup.maxParticipants) * 100
			: 0;

	const statusColors = useMemo(() => {
		if (percentage >= 80) return { background: '#FF5252', text: '#FFFFFF' };
		if (percentage >= 50) return { background: '#FFC107', text: '#1F1F1F' };
		return { background: '#4CAF50', text: '#FFFFFF' };
	}, [percentage]);

	const [imageLoaded, setImageLoaded] = useState(false);

	const heroImage = useMemo(() => {
		const key = typeof meetup?.id === 'string' ? meetup.id : String(meetup?.id ?? 0);
		const index = key.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
		return HERO_IMAGES[index % HERO_IMAGES.length];
	}, [meetup?.id]);

	const categories = meetup.categories ?? meetup.tags ?? [];

	return (
		<TouchableOpacity onPress={() => {}} style={styles.card}>
			<MeetupCoverGradient categories={categories} title={meetup.title} height={160} />

			<View style={styles.cardInner}>
				<View style={styles.hostRow}>
					<View style={styles.hostInfo}>
						<Avatar name={meetup?.organizerName ?? 'Yellow Club Host'} size={32} />
						<View>
							<Text style={styles.hostLabel}>Hosted by</Text>
							<Text style={styles.hostName}>{meetup?.organizerName ?? 'Yellow Club Host'}</Text>
						</View>
					</View>

					<View style={[styles.statusBadge, { backgroundColor: statusColors.background }]}>
						<Text style={[styles.statusText, { color: statusColors.text }]}>
							{participantsJoined}/{meetup.maxParticipants} joined
						</Text>
					</View>
				</View>

				<Text style={styles.title}>{meetup.title}</Text>

				{/* Visual: inline iconography for time and place */}
				<View style={styles.metaSection}>
					<View style={styles.metaRow}>
						<Ionicons name="calendar-outline" size={14} color="#666666" style={styles.metaIcon} />
						<Text style={styles.metaText}>{formattedDate}</Text>
					</View>
					<View style={styles.metaRow}>
						<Ionicons name="location-outline" size={14} color="#666666" style={styles.metaIcon} />
						<Text style={styles.metaText} numberOfLines={1}>
							{meetup.area}
						</Text>
					</View>
				</View>

				{/* Visual: soft category chips for quick scanning */}
				{Array.isArray(meetup?.tags) && meetup.tags.length > 0 ? (
					<View style={styles.tagRow}>
						{meetup.tags.slice(0, 4).map((tag: string) => (
							<View key={tag} style={styles.tagChip}>
								<Text style={styles.tagText}>{tag}</Text>
							</View>
						))}
					</View>
				) : null}

				<Text style={styles.description} numberOfLines={3}>
					{meetup.description}
				</Text>
			</View>
		</TouchableOpacity>
	);
};

export default EventCard;

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		overflow: 'hidden',
		...Platform.select({
			ios: {
				shadowColor: '#000000',
				shadowOffset: { width: 0, height: 6 },
				shadowOpacity: 0.1,
				shadowRadius: 16,
			},
			android: {
				elevation: 5,
			},
		}),
	},
	// Visual: hero image container keeps rounding consistent
	imageWrapper: {
		height: 160,
		width: '100%',
		overflow: 'hidden',
	},
	cardImage: {
		height: '100%',
		width: '100%',
	},
	// Visual: gentle placeholder while hero image loads
	imagePlaceholder: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: '#ECECEC',
	},
	cardInner: {
		padding: 18,
		gap: 12,
	},
	hostRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	hostInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		maxWidth: '65%',
	},
	hostLabel: {
		fontSize: 11,
		color: '#6B6B6B',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
		marginBottom: 2,
	},
	hostName: {
		fontSize: 14,
		color: '#1D1D1D',
		fontWeight: '600',
	},
	// Visual: badge tone changes with fill percentage
	statusBadge: {
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	statusText: {
		fontSize: 12,
		fontWeight: '700',
	},
	title: {
		fontSize: 19,
		fontWeight: '700',
		color: '#151515',
	},
	metaSection: {
		gap: 6,
	},
	metaRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	metaIcon: {
		marginRight: 6,
	},
	metaText: {
		fontSize: 13,
		color: '#6B6B6B',
	},
	tagRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	// Visual: soft accent chips for categories
	tagChip: {
		borderRadius: 999,
		backgroundColor: '#FFF4D0',
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	tagText: {
		fontSize: 12,
		color: '#8A6A00',
		fontWeight: '600',
	},
	description: {
		fontSize: 13,
		color: '#3A3A3A',
		lineHeight: 19,
	},
});