import {
  collection,
  getDocs,
  doc,
  runTransaction,
  addDoc,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { DEMO_MEETUPS, DemoMeetupParticipant, type DemoMeetup } from '../../data/demoMeetups';
import { AnyMeetup, FirebaseMeetup, NormalizedMeetup } from '../../types/meetup';

export type MeetupParticipant = {
  id: string;
  name: string;
};

export type Meetup = NormalizedMeetup;

const meetupsCollection = () => collection(db, 'meetups');

const normalizeParticipants = (value: unknown): MeetupParticipant[] =>
  Array.isArray(value)
    ? value
        .map((entry: any) => {
          if (typeof entry === 'string') {
            return { id: entry, name: entry };
          }
          const id = entry?.id ?? entry?.email ?? entry?.uid ?? entry?.name;
          const name = entry?.name ?? entry?.displayName ?? id ?? 'Member';
          return id ? { id: String(id), name: String(name) } : null;
        })
        .filter((item): item is MeetupParticipant => Boolean(item?.id))
    : [];

const DEMO_MODE = true;

const cloneDemoMeetup = (meetup: DemoMeetup): DemoMeetup => ({
  ...meetup,
  participants: meetup.participants.map(participant => ({ ...participant })),
  host: { ...meetup.host },
  tags: [...(meetup.tags ?? [])],
});

type DemoParticipantInput = Partial<DemoMeetupParticipant> & { id: string };

let demoMeetupsState: DemoMeetup[] = DEMO_MEETUPS.map(cloneDemoMeetup);

const normaliseDemoParticipant = (participant: DemoParticipantInput): DemoMeetupParticipant => ({
  id: participant.id,
  name: participant.name ?? 'Guest Member',
  email: participant.email ?? `${participant.id}@demo.local`,
});

const findDemoMeetupIndex = (meetupId: string) =>
  demoMeetupsState.findIndex((meetup) => meetup.id === meetupId);

const addDemoParticipant = (meetupId: string, participant: DemoParticipantInput) => {
  const index = findDemoMeetupIndex(meetupId);
  if (index === -1) {
    return;
  }
  const meetup = demoMeetupsState[index];
  if (meetup.participants.some((entry) => entry.id === participant.id)) {
    return;
  }
  if (meetup.participants.length >= meetup.maxParticipants) {
    return;
  }
  const safeParticipant = normaliseDemoParticipant(participant);
  demoMeetupsState = [
    ...demoMeetupsState.slice(0, index),
    {
      ...meetup,
      participants: [...meetup.participants, safeParticipant],
    },
    ...demoMeetupsState.slice(index + 1),
  ];
};

const removeDemoParticipant = (meetupId: string, participantId: string) => {
  const index = findDemoMeetupIndex(meetupId);
  if (index === -1) {
    return;
  }
  const meetup = demoMeetupsState[index];
  demoMeetupsState = [
    ...demoMeetupsState.slice(0, index),
    {
      ...meetup,
      participants: meetup.participants.filter((entry) => entry.id !== participantId),
    },
    ...demoMeetupsState.slice(index + 1),
  ];
};

export const createMeetup = async (
  meetup: Omit<Meetup, 'id' | 'participants' | 'createdAt' | 'source'>,
) => {
  const { tags, ...rest } = meetup;
  const docRef = await addDoc(meetupsCollection(), {
    ...rest,
    createdAt: new Date().toISOString(),
    participants: [],
    tags: tags ?? [],
  });
  return docRef.id;
};

export const getMeetups = async (): Promise<AnyMeetup[]> => {
  if (DEMO_MODE) {
    return demoMeetupsState.map(cloneDemoMeetup);
  }
  const snapshot = await getDocs(query(meetupsCollection(), orderBy('createdAt', 'desc')));

  return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    const data: any = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      date: data.date,
      area: data.area,
      maxParticipants: data.maxParticipants,
      description: data.description,
      organizerId: data.organizerId,
      organizerName: data.organizerName,
      createdAt: data.createdAt ?? '',
      participants: normalizeParticipants(data?.participants),
      tags: Array.isArray(data?.tags) ? data.tags : [],
      source: 'firebase',
    } as FirebaseMeetup;
  });
};

export const getMeetup = async (meetupId: string): Promise<AnyMeetup | null> => {
  if (DEMO_MODE) {
    const meetup = demoMeetupsState.find(entry => entry.id === meetupId);
    return meetup ? cloneDemoMeetup(meetup) : null;
  }
  const snapshot = await getDocs(query(meetupsCollection(), where('id', '==', meetupId)));

  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  const data: any = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title,
    date: data.date,
    area: data.area,
    maxParticipants: data.maxParticipants,
    description: data.description,
    organizerId: data.organizerId,
    organizerName: data.organizerName,
    createdAt: data.createdAt ?? '',
    participants: normalizeParticipants(data?.participants),
    tags: Array.isArray(data?.tags) ? data.tags : [],
    source: 'firebase',
  } as FirebaseMeetup;
};

export const joinMeetup = async (meetupId: string, participant: DemoParticipantInput) => {
  if (DEMO_MODE) {
    addDemoParticipant(meetupId, participant);
    return;
  }
  const meetupRef = doc(db, 'meetups', meetupId);

  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(meetupRef);
    if (!snapshot.exists) {
      throw new Error('MEETUP_NOT_FOUND');
    }

    const data = snapshot.data() ?? {};
    const existing = normalizeParticipants((data as any).participants);

    if (existing.some(item => item.id === participant.id)) {
      return;
    }

    transaction.update(meetupRef, {
      participants: [...existing, participant],
    });
  });
};

export const leaveMeetup = async (meetupId: string, participantId: string) => {
  if (DEMO_MODE) {
    removeDemoParticipant(meetupId, participantId);
    return;
  }
  const meetupRef = doc(db, 'meetups', meetupId);

  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(meetupRef);
    if (!snapshot.exists) {
      throw new Error('MEETUP_NOT_FOUND');
    }

    const data = snapshot.data() ?? {};
    const existing = normalizeParticipants((data as any).participants);

    if (!existing.some(item => item.id === participantId)) {
      return;
    }

    transaction.update(meetupRef, {
      participants: existing.filter(item => item.id !== participantId),
    });
  });
};