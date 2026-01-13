import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

const COLORS = ['#667eea', '#4facfe', '#43e97b', '#fa709a', '#30cfd0', '#ff9a9e'];

type AvatarProps = {
	name: string;
	size?: number;
	style?: StyleProp<ViewStyle>;
};

const getInitials = (name: string) => {
	const trimmed = name.trim();
	if (!trimmed) return 'YC';
	const parts = trimmed.split(' ').filter(Boolean);
	if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'Y';
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getColor = (name: string) => {
	const key = name.trim() || 'Yellow Club';
	const sum = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	return COLORS[sum % COLORS.length];
};

export default function Avatar({ name, size = 40, style }: AvatarProps) {
	const initials = useMemo(() => getInitials(name), [name]);
	const backgroundColor = useMemo(() => getColor(name), [name]);
	return (
		<View
			style={[
				styles.container,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor,
				},
				style,
			]}
		>
			<Text style={[styles.text, { fontSize: size * 0.42 }]}>{initials}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000000',
		shadowOpacity: 0.08,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	text: {
		color: '#FFFFFF',
		fontWeight: '700',
		letterSpacing: 0.4,
	},
});
