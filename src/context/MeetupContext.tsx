import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { DEMO_AUTH } from '../config/env';
import { AnyMeetup, MeetupSource } from '../types/meetup';
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

const CUSTOM_DEMO_MEETUPS_KEY = 'demo_custom_meetups';

const persistCustomMeetups = async (items: Meetup[]) => {
	if (!DEMO_AUTH) return;
	const custom = items.filter(entry => entry.source === 'demo' && entry.id.startsWith('demo-'));
	try {
		await AsyncStorage.setItem(CUSTOM_DEMO_MEETUPS_KEY, JSON.stringify(custom));
	} catch (error) {
		console.warn('[MeetupProvider] Failed to persist demo meetups', error);
	}
};

const normaliseMeetup = (input: AnyMeetup): Meetup => {
	if (input.source === 'demo') {
		return {
			id: input.id,
			title: input.title,
			date: input.dateTime,
			area: input.location,
			maxParticipants: input.maxParticipants,
			description: input.description,
			organizerId: input.host.id,
			organizerName: input.host.name,
			createdAt: input.createdAt ?? input.dateTime,
			participants: (input.participants ?? []).map((participant: any) => ({
				id: String(participant?.id ?? participant?.email ?? participant?.name),
				name: String(participant?.name ?? participant?.email ?? 'Member'),
			})),
			tags: input.tags,
			source: 'demo' as MeetupSource,
		};
	}
	return {
		id: input.id,
		title: input.title,
		date: input.date,
		area: input.area,
		maxParticipants: input.maxParticipants,
		description: input.description,
		organizerId: input.organizerId,
		organizerName: input.organizerName,
		createdAt: input.createdAt ?? '',
		participants: input.participants ?? [],
		tags: input.tags,
		source: 'firebase' as MeetupSource,
	};
};

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
		const raw = await getMeetups();
		const normalised = raw.map(normaliseMeetup);
		if (!DEMO_AUTH) {
			setMeetups(normalised);
			return;
		}
		let stored: Meetup[] = [];
		try {
			const serialized = await AsyncStorage.getItem(CUSTOM_DEMO_MEETUPS_KEY);
			if (serialized) {
				const parsed = JSON.parse(serialized) as Meetup[];
				stored = parsed
					.map(item => ({
						...item,
						source: 'demo' as MeetupSource,
						participants: item.participants ?? [],
					}))
					.filter(item => item.id && item.title);
			}
		} catch (error) {
			console.warn('[MeetupProvider] Failed to read stored demo meetups', error);
		}
		const merged = [...stored, ...normalised].reduce<Meetup[]>((acc, item) => {
			if (!acc.some(entry => entry.id === item.id)) acc.push(item);
			return acc;
		}, []);
		setMeetups(merged);
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
		async (payload: Omit<Meetup, 'id' | 'participants' | 'createdAt' | 'source'>) => {
			const optimisticSource: MeetupSource = DEMO_AUTH ? 'demo' : 'firebase';
			const optimistic: Meetup = {
				id: `${DEMO_AUTH ? 'demo' : 'temp'}-${Date.now()}`,
				...payload,
				source: optimisticSource,
				createdAt: new Date().toISOString(),
				participants: [],
			};

			if (DEMO_AUTH) {
				setMeetups(prev => {
					const next = [optimistic, ...prev];
					persistCustomMeetups(next).catch(() => {});
					return next;
				});
				return optimistic;
			}

			setMeetups(prev => [optimistic, ...prev]);
			try {
				const createdId = await createMeetupApi(payload);
				const persisted: Meetup = { ...optimistic, id: createdId, source: 'firebase' as MeetupSource };
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

			setMeetups(prev => {
				const next = prev.map(item => {
					if (item.id !== meetupId) return item;
					if (item.participants.some(entry => identifiers.includes(entry.id))) {
						return item;
					}
					rollback = item.participants;
					return { ...item, participants: [...item.participants, participant] };
				});
				if (DEMO_AUTH) {
					persistCustomMeetups(next).catch(() => {});
				}
				return next;
			});

			if (DEMO_AUTH) return;

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
