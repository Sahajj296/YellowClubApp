import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import HostProfileScreen from '../screens/HostProfileScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';

const LoggedInStack = createNativeStackNavigator();
const PublicStack = createNativeStackNavigator();

type RootNavigatorProps = {
	isLoggedIn?: boolean;
	navigationKey?: string;
};

function AuthenticatedStack() {
	return (
		<LoggedInStack.Navigator screenOptions={{ headerShown: false }}>
			<LoggedInStack.Screen name="MainTabs" component={MainTabs} />
			<LoggedInStack.Screen
				name="HostProfile"
				component={HostProfileScreen}
				options={{ headerShown: true, title: 'Host Profile' }}
			/>
			<LoggedInStack.Screen
				name="BookingConfirmation"
				component={BookingConfirmationScreen}
				options={{ headerShown: true, title: 'Booking Confirmed' }}
			/>
		</LoggedInStack.Navigator>
	);
}

function UnauthenticatedStack() {
	return (
		<PublicStack.Navigator screenOptions={{ headerShown: false }}>
			<PublicStack.Screen name="Auth" component={AuthStack} />
		</PublicStack.Navigator>
	);
}

export default function RootNavigator({ isLoggedIn = false, navigationKey = 'root' }: RootNavigatorProps) {
	return (
		<NavigationContainer key={navigationKey}>
			{isLoggedIn ? <AuthenticatedStack /> : <UnauthenticatedStack />}
		</NavigationContainer>
	);
}
