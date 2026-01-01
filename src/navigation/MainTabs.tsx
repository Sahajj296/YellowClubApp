import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ExploreScreen from '../screens/ExploreScreen';
import CreateMeetupScreen from '../screens/CreateMeetupScreen';
import BookingsScreen from '../screens/BookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import { useProfile } from '../context/ProfileContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const iconMap: Record<string, { active: string; inactive: string }> = {
	Explore: { active: 'compass', inactive: 'compass-outline' },
	CreateMeetup: { active: 'add-circle', inactive: 'add-circle-outline' },
	Bookings: { active: 'calendar', inactive: 'calendar-outline' },
	Profile: { active: 'person', inactive: 'person-outline' },
};

function Tabs() {
	const { currentUserProfile } = useProfile();
	const role = currentUserProfile?.role === 'organizer' ? 'organizer' : 'user';

	const routes = useMemo(() => {
		const list = [{ name: 'Explore', component: ExploreScreen, label: 'Explore' }];
		if (role === 'organizer') {
			list.push({ name: 'CreateMeetup', component: CreateMeetupScreen, label: 'Create Meetup' });
		}
		list.push(
			{ name: 'Bookings', component: BookingsScreen, label: 'My Meetups' },
			{ name: 'Profile', component: ProfileScreen, label: 'Profile' },
		);
		return list;
	}, [role]);

	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				headerShown: false,
				tabBarIcon: ({ focused, color }) => {
					const icons = iconMap[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
					const icon = focused ? icons.active : icons.inactive;
					return <Ionicons name={icon} size={24} color={color} />;
				},
				tabBarActiveTintColor: '#000',
				tabBarInactiveTintColor: '#7A7A7A',
				tabBarStyle: { backgroundColor: '#ffffff', borderTopWidth: 0.5, borderTopColor: '#E6E6E6' },
				tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
			})}
		>
			{routes.map(route => (
				<Tab.Screen key={route.name} name={route.name} component={route.component} options={{ tabBarLabel: route.label }} />
			))}
		</Tab.Navigator>
	);
}

export default function MainTabs() {
	return (
		<Stack.Navigator>
			<Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
			<Stack.Screen
				name="EventDetails"
				component={EventDetailsScreen}
				options={{ title: 'Event Details' }}
			/>
		</Stack.Navigator>
	);
}
