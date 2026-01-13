// This file defines the types for the navigation in the app

export type RootStackParamList = {
  Explore: undefined;
  MyMeetups: undefined;
  Profile: undefined;
  MeetupDetail: { meetupId: string };
  CreateMeetup: undefined;
};