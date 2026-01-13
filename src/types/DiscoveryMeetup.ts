export type DiscoveryMeetup = {
  dateTime: string;
  id: string;
  title: string;
  date: string;
  area: string;
  organizerId: string;
  organizerName: string;
  maxParticipants: number;
  participants: any[];
  description?: string;
  tags?: string[];
};
