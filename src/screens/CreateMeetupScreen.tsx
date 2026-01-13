import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	Pressable,
	Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from '../context/ProfileContext';
import { useMeetups } from '../context/MeetupContext';
import PrimaryButton from '../components/PrimaryButton';
import { MeetupSource } from '../types/meetup';

const MIN_PARTICIPANTS = 5;
const MAX_PARTICIPANTS = 10;

export default function CreateMeetupScreen() {
	const navigation = useNavigation<any>();
	const { currentUserProfile } = useProfile();
	const { addMeetup } = useMeetups();
	const [title, setTitle] = useState('');
	const [area, setArea] = useState('');
	const [date, setDate] = useState('');
	const [maxParticipants, setMaxParticipants] = useState(MIN_PARTICIPANTS);
	const [description, setDescription] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!successMessage) return;
		const timer = setTimeout(() => setSuccessMessage(null), 2500);
		return () => clearTimeout(timer);
	}, [successMessage]);

	const validate = () => {
		const errs: { [key: string]: string } = {};
		if (!title.trim()) errs.title = 'Title is required.';
		if (!area.trim()) errs.area = 'Area is required.';
		if (!date.trim()) errs.date = 'Date is required.';
		if (maxParticipants < MIN_PARTICIPANTS || maxParticipants > MAX_PARTICIPANTS) {
			errs.maxParticipants = `Max participants must be between ${MIN_PARTICIPANTS} and ${MAX_PARTICIPANTS}.`;
		}
		return errs;
	};

	const onPublish = async () => {
		const errs = validate();
		setErrors(errs);
		if (Object.keys(errs).length > 0) return;
		if (!currentUserProfile?.id) {
			Alert.alert('Profile required', 'Complete your profile before hosting a meetup.');
			return;
		}
		setSubmitting(true);
		try {
			const meetupPayload = {
				title: title.trim(),
				area: area.trim(),
				date: date.trim(),
				maxParticipants,
				description: description.trim(),
				organizerId: currentUserProfile.id,
				organizerName: currentUserProfile.name || currentUserProfile.email,
				host: {
					id: currentUserProfile.id,
					name: currentUserProfile.name || currentUserProfile.email,
					email: currentUserProfile.email,
				},
				tags: [],
				source: 'demo' as MeetupSource,
			};
			await addMeetup(meetupPayload);
			setTitle('');
			setArea('');
			setDate('');
			setDescription('');
			setSuccessMessage('Meetup published! Members can RSVP immediately.');
		} catch (e) {
			Alert.alert('Error', 'Failed to publish meetup. Please try again.');
			setErrors(prev => ({ ...prev, submit: 'Couldn’t publish this meetup. Try again shortly.' }));
		} finally {
			setSubmitting(false);
		}
	};

	const canPublish =
		Boolean(currentUserProfile?.id && title.trim() && area.trim() && date.trim()) && !submitting;

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<View style={styles.header}>
				<Pressable
					onPress={() => {
						if (navigation.canGoBack()) navigation.goBack();
					}}
					style={({ pressed }) => [
						styles.backButton,
						pressed ? styles.backButtonPressed : null,
					]}
				>
					<Ionicons name="arrow-back" size={20} color="#1A1A1A" />
				</Pressable>
				<View>
					<Text style={styles.headerTitle}>Create Meetup</Text>
					<Text style={styles.headerSubtitle}>Craft a memorable Yellow Club session</Text>
				</View>
			</View>

			<Pressable style={styles.coverPlaceholder} disabled>
				<Ionicons name="images-outline" size={28} color="#999999" />
				<Text style={styles.coverText}>Add a cover image (coming soon)</Text>
			</Pressable>

			<View style={styles.fieldBlock}>
				<Text style={styles.fieldLabel}>Meetup title</Text>
				<View style={[
					styles.inputRow,
					errors.title ? styles.inputRowError : null,
				]}>
					<Ionicons name="bookmark-outline" size={18} color="#999999" />
					<TextInput
						style={styles.input}
						placeholder="Meaningful headline"
						placeholderTextColor="#999999"
						cursorColor="#1A1A1A"
						value={title}
						onChangeText={setTitle}
						maxLength={60}
					/>
				</View>
				<View style={styles.inlineMeta}>
					<Text style={styles.charCount}>{title.length}/60</Text>
					{errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
				</View>
			</View>

			<View style={styles.fieldBlock}>
				<Text style={styles.fieldLabel}>Location</Text>
				<View style={[
					styles.inputRow,
					errors.area ? styles.inputRowError : null,
				]}>
					<Ionicons name="location-outline" size={18} color="#999999" />
					<TextInput
						style={styles.input}
						placeholder="City, venue, or virtual link"
						placeholderTextColor="#999999"
						cursorColor="#1A1A1A"
						value={area}
						onChangeText={setArea}
						maxLength={60}
					/>
				</View>
				<View style={styles.inlineMeta}>
					<Text style={styles.charCount}>{area.length}/60</Text>
					{errors.area ? <Text style={styles.errorText}>{errors.area}</Text> : null}
				</View>
			</View>

			<View style={styles.fieldBlock}>
				<Text style={styles.fieldLabel}>Date & time</Text>
				<View style={[
					styles.inputRow,
					errors.date ? styles.inputRowError : null,
				]}>
					<Ionicons name="calendar-outline" size={18} color="#999999" />
					<TextInput
						style={styles.input}
						placeholder="2024-06-01 18:00"
						placeholderTextColor="#999999"
						cursorColor="#1A1A1A"
						value={date}
						onChangeText={setDate}
						maxLength={30}
					/>
				</View>
				{errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
			</View>

			<View style={[styles.fieldBlock, styles.capacityCard]}>
				<View style={styles.capacityHeader}>
					<View style={styles.capacityIconWrap}>
						<Ionicons name="people-outline" size={18} color="#FFD700" />
					</View>
					<Text style={styles.capacityLabel}>Max participants</Text>
					<Text style={styles.capacityHint}>Between {MIN_PARTICIPANTS}-{MAX_PARTICIPANTS} attendees</Text>
				</View>
				<View style={styles.capacityControls}>
					<Text style={styles.capacityCount}>{maxParticipants}</Text>
					<View style={styles.capacityButtons}>
						<TouchableOpacity
							style={[
								styles.capacityButton,
								maxParticipants === MIN_PARTICIPANTS ? styles.capacityButtonDisabled : null,
							]}
							activeOpacity={0.85}
							onPress={() => setMaxParticipants(Math.max(MIN_PARTICIPANTS, maxParticipants - 1))}
							disabled={maxParticipants === MIN_PARTICIPANTS}
						>
							<Ionicons name="remove" size={18} color="#1A1A1A" />
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.capacityButton,
								maxParticipants === MAX_PARTICIPANTS ? styles.capacityButtonDisabled : null,
							]}
							activeOpacity={0.85}
							onPress={() => setMaxParticipants(Math.min(MAX_PARTICIPANTS, maxParticipants + 1))}
							disabled={maxParticipants === MAX_PARTICIPANTS}
						>
							<Ionicons name="add" size={18} color="#1A1A1A" />
						</TouchableOpacity>
					</View>
				</View>
				{errors.maxParticipants ? <Text style={styles.errorText}>{errors.maxParticipants}</Text> : null}
			</View>

			<View style={styles.fieldBlock}>
				<Text style={styles.fieldLabel}>Description</Text>
				<View style={styles.textAreaWrapper}>
					<TextInput
						style={styles.textArea}
						placeholder="What should attendees expect?"
						placeholderTextColor="#999999"
						cursorColor="#1A1A1A"
						value={description}
						onChangeText={t => t.length <= 300 && setDescription(t)}
						multiline
						maxLength={300}
					/>
					<Text style={styles.charCount}>{description.length}/300</Text>
				</View>
			</View>

			<PrimaryButton
				title={submitting ? 'Publishing…' : 'Publish Meetup'}
				onPress={onPublish}
				// @ts-ignore
				disabled={!canPublish}
			/>

			{errors.submit ? <Text style={styles.errorTextStandalone}>{errors.submit}</Text> : null}
			{successMessage ? <Text style={styles.successBanner}>{successMessage}</Text> : null}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 20,
		paddingTop: 24,
		paddingBottom: 32,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 24,
		gap: 16,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFFFFF',
	},
	backButtonPressed: {
		transform: [{ scale: 0.96 }],
		opacity: 0.8,
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
	coverPlaceholder: {
		height: 140,
		borderRadius: 16,
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: '#E0E0E0',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#F8F9FA',
		marginBottom: 24,
		gap: 8,
	},
	coverText: {
		fontSize: 14,
		color: '#666666',
	},
	fieldBlock: {
		marginBottom: 24,
	},
	fieldLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#1A1A1A',
		marginBottom: 8,
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		paddingHorizontal: 14,
		backgroundColor: '#F8F9FA',
	},
	inputRowError: {
		borderColor: '#FF5252',
		backgroundColor: '#FFF5F5',
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: '#1A1A1A',
		paddingVertical: 12,
		marginLeft: 8,
	},
	inlineMeta: {
		marginTop: 6,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	charCount: {
		fontSize: 12,
		color: '#999999',
	},
	errorText: {
		fontSize: 12,
		color: '#FF5252',
	},
	textAreaWrapper: {
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		backgroundColor: '#F8F9FA',
		paddingHorizontal: 14,
		paddingTop: 12,
		paddingBottom: 14,
	},
	textArea: {
		fontSize: 16,
		color: '#1A1A1A',
		minHeight: 100,
		textAlignVertical: 'top',
	},
	capacityCard: {
		borderRadius: 16,
		backgroundColor: '#F8F9FA',
		padding: 16,
		borderWidth: 1,
		borderColor: '#E0E0E0',
	},
	capacityHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	capacityIconWrap: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#FFF9E0',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	capacityLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1A1A1A',
	},
	capacityHint: {
		marginLeft: 'auto',
		fontSize: 12,
		color: '#999999',
	},
	capacityControls: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	capacityCount: {
		fontSize: 32,
		fontWeight: '700',
		color: '#1A1A1A',
	},
	capacityButtons: {
		flexDirection: 'row',
		gap: 12,
	},
	capacityButton: {
		width: 44,
		height: 44,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		backgroundColor: '#FFFFFF',
		alignItems: 'center',
		justifyContent: 'center',
	},
	capacityButtonDisabled: {
		backgroundColor: '#F0F0F0',
		borderColor: '#E8E8E8',
	},
	errorTextStandalone: {
		marginTop: 12,
		color: '#FF5252',
		fontSize: 13,
		textAlign: 'center',
	},
	successBanner: {
		marginTop: 16,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
		backgroundColor: '#EAF7ED',
		color: '#2E7D32',
		fontSize: 13,
		fontWeight: '600',
		textAlign: 'center',
	},
});
