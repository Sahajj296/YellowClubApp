import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';
import {
	createMeetup as createMeetupApi,
	getMeetups,
	joinMeetup as joinMeetupApi,
	type Meetup,
	type MeetupParticipant,
} from '../services/api/meetups';
import { useProfile } from './ProfileContext';

type MeetupContextValue = {
	meetups: Meetup[];
	myMeetups: Meetup[];
	loading: boolean;
	refreshing: boolean;
	error: string | null;
	fetchMeetups: () => Promise<void>;
	refreshMeetups: () => Promise<void>;
	addMeetup: (payload: Omit<Meetup, 'id' | 'participants' | 'createdAt'>) => Promise<Meetup>;
	joinMeetup: (meetupId: string) => Promise<void>;
	isJoined: (meetupId: string) => boolean;
};

const MeetupContext = createContext<MeetupContextValue | undefined>(undefined);

export const MeetupProvider = ({ children }: { children: ReactNode }) => {
	const { currentUserProfile } = useProfile();
	const userId = currentUserProfile?.id ?? '';
	const userEmail = currentUserProfile?.email ?? '';
	const userName = currentUserProfile?.name ?? userEmail ?? userId;
	const identifiers = useMemo(
		() => [userId, userEmail].filter((value): value is string => Boolean(value)),
		[userEmail, userId],
	);

	const [meetups, setMeetups] = useState<Meetup[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const hydrate = useCallback(async () => {
		const data = await getMeetups();
		setMeetups(data);
	}, []);

	const fetchMeetups = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			await hydrate();
		} catch {
			setError('Unable to load meetups right now.');
		} finally {
			setLoading(false);
		}
	}, [hydrate]);

	const refreshMeetups = useCallback(async () => {
		setRefreshing(true);
		setError(null);
		try {
			await hydrate();
		} catch {
			setError('Unable to refresh meetups right now.');
		} finally {
			setRefreshing(false);
		}
	}, [hydrate]);

	useEffect(() => {
		fetchMeetups();
	}, [fetchMeetups]);

	const addMeetup = useCallback(
		async (payload: Omit<Meetup, 'id' | 'participants' | 'createdAt'>) => {
			const optimistic: Meetup = {
				id: `temp-${Date.now()}`,
				...payload,
				createdAt: new Date().toISOString(),
				participants: [],
			};
			setMeetups(prev => [optimistic, ...prev]);

			try {
				const createdId = await createMeetupApi(payload);
				const persisted = { ...optimistic, id: createdId };
				setMeetups(prev =>
					prev.map(item => (item.id === optimistic.id ? persisted : item)),
				);
				return persisted;
			} catch (err) {
				setMeetups(prev => prev.filter(item => item.id !== optimistic.id));
				setError('Failed to create meetup, please try again.');
				throw err;
			}
		},
		[],
	);

	const joinMeetup = useCallback(
		async (meetupId: string) => {
			if (!identifiers.length) {
				setError('Please complete your profile before joining.');
				throw new Error('PROFILE_NOT_READY');
			}
			const participant: MeetupParticipant = {
				id: identifiers[0],
				name: userName || identifiers[0],
			};
			let rollback: MeetupParticipant[] | null = null;

			setMeetups(prev =>
				prev.map(item => {
					if (item.id !== meetupId) {
						return item;
					}
					if (item.participants.some(entry => identifiers.includes(entry.id))) {
						return item;
					}
					rollback = item.participants;
					return { ...item, participants: [...item.participants, participant] };
				}),
			);

			try {
				await joinMeetupApi(meetupId, participant);
			} catch (err) {
				setMeetups(prev =>
					prev.map(item =>
						item.id === meetupId && rollback
							? { ...item, participants: rollback }
							: item,
					),
				);
				setError('Unable to join this meetup right now.');
				throw err;
			}
		},
		[identifiers, userName],
	);

	const isJoined = useCallback(
		(meetupId: string) =>
			meetups.some(
				item =>
					item.id === meetupId &&
					item.participants.some(entry => identifiers.includes(entry.id)),
			),
		[identifiers, meetups],
	);

	const myMeetups = useMemo(() => {
		if (!identifiers.length) {
			return [];
		}
		return meetups.filter(
			item =>
				identifiers.includes(item.organizerId) ||
				item.participants.some(entry => identifiers.includes(entry.id)),
		);
	}, [identifiers, meetups]);

	const value = useMemo<MeetupContextValue>(
		() => ({
			meetups,
			myMeetups,
			loading,
			refreshing,
			error,
			fetchMeetups,
			refreshMeetups,
			addMeetup,
			joinMeetup,
			isJoined,
		}),
		[
			meetups,
			myMeetups,
			loading,
			refreshing,
			error,
			fetchMeetups,
			refreshMeetups,
			addMeetup,
			joinMeetup,
			isJoined,
		],
	);

	return <MeetupContext.Provider value={value}>{children}</MeetupContext.Provider>;
};

export const useMeetups = (): MeetupContextValue => {
	const context = useContext(MeetupContext);
	if (!context) {
		throw new Error('useMeetups must be used within a MeetupProvider');
	}
	return context;
};
