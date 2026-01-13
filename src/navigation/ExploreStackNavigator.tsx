import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExploreScreen from '../screens/ExploreScreen';
import MeetupDetailScreen from '../screens/MeetupDetailScreen';

export type ExploreStackParamList = {
	ExploreScreen: undefined;
	MeetupDetail: { meetupId: string };
};

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export default function ExploreStackNavigator() {
	return (
		<Stack.Navigator initialRouteName="ExploreScreen" screenOptions={{ headerShown: false }}>
			<Stack.Screen name="ExploreScreen" component={ExploreScreen} />
			<Stack.Screen name="MeetupDetail" component={MeetupDetailScreen} />
		</Stack.Navigator>
	);
}
