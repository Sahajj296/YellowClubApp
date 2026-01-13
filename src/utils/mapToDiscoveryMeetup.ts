import { Meetup } from '../services/api/meetups';
import { DiscoveryMeetup } from '../types/DiscoveryMeetup';

export function mapToDiscoveryMeetup(meetup: Meetup): DiscoveryMeetup {
	return {
		id: meetup.id,
		title: meetup.title,
		date: meetup.date,
		dateTime: meetup.date,
		area: meetup.area,
		organizerId: meetup.organizerId,
		organizerName: meetup.organizerName,
		maxParticipants: meetup.maxParticipants,
		participants: meetup.participants ?? [],
		description: meetup.description,
		tags: meetup.tags ?? [],
	};
}
