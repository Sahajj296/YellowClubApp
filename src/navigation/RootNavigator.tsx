import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import CreateMeetupScreen from '../screens/CreateMeetupScreen';
import MeetupDetailScreen from '../screens/MeetupDetailScreen';
import { MeetupProvider } from '../context/MeetupContext';
import { Meetup } from '../services/api/meetups';

export type RootStackParamList = {
	MainTabs: undefined;
	BookingConfirmation: { title: string; date: string; location: string };
	CreateMeetup: undefined;
	MeetupDetail: { meetup: Meetup };
	Auth: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNavigatorProps = {
	isLoggedIn: boolean;
};

function AuthenticatedStack() {
	return (
		<MeetupProvider>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				<Stack.Screen name="MainTabs" component={MainTabs} />
				<Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
				<Stack.Screen name="CreateMeetup" component={CreateMeetupScreen} />
				<Stack.Screen name="MeetupDetail" component={MeetupDetailScreen} />
			</Stack.Navigator>
		</MeetupProvider>
	);
}

function UnauthenticatedStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Auth" component={AuthStack} />
		</Stack.Navigator>
	);
}

export default function RootNavigator({ isLoggedIn }: RootNavigatorProps) {
	return (
		<NavigationContainer>
			{isLoggedIn ? <AuthenticatedStack /> : <UnauthenticatedStack />}
		</NavigationContainer>
	);
}
