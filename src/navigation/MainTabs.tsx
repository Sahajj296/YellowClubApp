import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import ExploreStackNavigator from './ExploreStackNavigator';
import CreateMeetupScreen from '../screens/CreateMeetupScreen';
import BookingsScreen from '../screens/BookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import { useProfile } from '../context/ProfileContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
	const { currentUserProfile } = useProfile();
	const role = currentUserProfile?.role === 'organizer' ? 'organizer' : 'user';

	const routes = useMemo(() => {
		const list = [{ name: 'Explore', component: ExploreStackNavigator, label: 'Explore' }];
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
				tabBarIcon: ({ focused }) => {
					const iconName =
						route.name === 'Explore'
							? focused
								? 'compass'
								: 'compass-outline'
							: route.name === 'CreateMeetup'
							? focused
								? 'people'
								: 'people-outline'
							: route.name === 'Bookings'
							? focused
								? 'calendar'
								: 'calendar-outline'
							: focused
							? 'person-circle'
							: 'person-circle-outline';
					const tint = focused ? '#FFD700' : '#999999';
					return <Icon name={iconName} size={26} color={tint} />;
				},
				tabBarActiveTintColor: '#FFD700',
				tabBarInactiveTintColor: '#999999',
				tabBarLabelStyle: { marginTop: 6, fontWeight: '600', fontSize: 12 },
				tabBarIconStyle: { marginTop: 6 },
				tabBarStyle: {
					backgroundColor: '#FCFCFC',
					borderTopColor: '#E8E8E3',
					borderTopWidth: 1,
					shadowColor: '#000000',
					shadowOpacity: 0.08,
					shadowRadius: 12,
					shadowOffset: { width: 0, height: -4 },
					elevation: 10,
				},
			})}
		>
			{routes.map(route => (
				<Tab.Screen
					key={route.name}
					name={route.name}
					component={route.component}
					options={{ tabBarLabel: route.label }}
				/>
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
