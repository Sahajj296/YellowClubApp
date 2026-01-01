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
} from 'firebase/firestore';
import { db } from '../../firebase';

export type MeetupParticipant = {
  id: string;
  name: string;
};

export type Meetup = {
  host: any;
  id?: string;
  title: string;
  date: string;
  area: string;
  maxParticipants: number;
  description?: string;
  organizerId: string;
  organizerName: string;
  createdAt: string;
  participants: MeetupParticipant[];
  tags?: string[];
};

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

export const createMeetup = async (meetup: Omit<Meetup, 'id' | 'participants' | 'createdAt'>) => {
  const docRef = await addDoc(meetupsCollection(), {
    ...meetup,
    createdAt: new Date().toISOString(),
    participants: [],
    tags: meetup.tags ?? [],
  });
  return docRef.id;
};

export const getMeetups = async (): Promise<Meetup[]> => {
  const snapshot = await getDocs(query(meetupsCollection(), orderBy('createdAt', 'desc')));

  return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    const data: any = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      tags: Array.isArray(data?.tags) ? data.tags : [],
      participants: normalizeParticipants(data?.participants),
    } as Meetup;
  });
};

export const joinMeetup = async (meetupId: string, participant: MeetupParticipant) => {
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