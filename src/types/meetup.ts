export type MeetupSource = 'demo' | 'firebase';

export type BaseMeetup = {
  id: string;
  title: string;
  maxParticipants: number;
  participants: any[];
  description?: string;
  tags?: string[];
  createdAt?: string;
  source: MeetupSource;
};

export type FirebaseMeetup = BaseMeetup & {
  source: 'firebase';
  date: string;
  area: string;
  organizerId: string;
  organizerName: string;
};

export type DemoMeetup = BaseMeetup & {
  source: 'demo';
  dateTime: string;
  location: string;
  host: { id: string; name: string; email?: string };
};

export type AnyMeetup = FirebaseMeetup | DemoMeetup;

export type NormalizedMeetup = BaseMeetup & {
  source: MeetupSource;
  date: string;
  area: string;
  organizerId: string;
  organizerName: string;
};
