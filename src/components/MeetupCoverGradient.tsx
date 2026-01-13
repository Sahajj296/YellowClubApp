import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type MeetupCoverGradientProps = {
	categories?: string[] | null;
	title?: string;
	height?: number;
};

const categoryGradients: Record<string, [string, string]> = {
	AI: ['#667eea', '#764ba2'],
	Product: ['#f093fb', '#f5576c'],
	Leadership: ['#4facfe', '#00f2fe'],
	Sustainability: ['#43e97b', '#38f9d7'],
	Fashion: ['#fa709a', '#fee140'],
	Innovation: ['#30cfd0', '#330867'],
	Design: ['#a8edea', '#fed6e3'],
	Tech: ['#ff6e7f', '#bfe9ff'],
	Networking: ['#ffecd2', '#fcb69f'],
	default: ['#FFD700', '#FFA500'],
};

const categoryIcons: Record<string, string> = {
	AI: '🤖',
	Product: '📱',
	Leadership: '👔',
	Sustainability: '🌱',
	Fashion: '👗',
	Innovation: '💡',
	Design: '🎨',
	Tech: '💻',
	Networking: '🤝',
};

const MeetupCoverGradient: React.FC<MeetupCoverGradientProps> = ({
	categories = [],
	height = 160,
}) => {
	const normalized = categories.map(cat => cat?.trim()).filter(Boolean) as string[];

	const gradientColors = useMemo(() => {
		const match = normalized.find(cat =>
			Object.keys(categoryGradients).some(key =>
				cat.toLowerCase().includes(key.toLowerCase()),
			),
		);
		if (!match) return categoryGradients.default;
		const key =
			Object.keys(categoryGradients).find(k =>
				match.toLowerCase().includes(k.toLowerCase()),
			) ?? 'default';
		return categoryGradients[key];
	}, [normalized]);

	const icon = useMemo(() => {
		if (!normalized.length) return '📍';
		const match = normalized.find(cat =>
			Object.keys(categoryIcons).some(key =>
				cat.toLowerCase().includes(key.toLowerCase()),
			),
		);
		if (!match) return '📍';
		const key =
			Object.keys(categoryIcons).find(k =>
				match.toLowerCase().includes(k.toLowerCase()),
			) ?? '';
		return categoryIcons[key] ?? '📍';
	}, [normalized]);

	return (
		<LinearGradient
			colors={gradientColors}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			style={[styles.gradient, { height }]}
		>
			<View style={styles.overlay}>
				<View style={styles.iconWrap}>
					<Text style={styles.iconLabel}>{icon}</Text>
				</View>
			</View>
		</LinearGradient>
	);
};

const styles = StyleSheet.create({
	gradient: {
		width: '100%',
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
		overflow: 'hidden',
	},
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.1)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconWrap: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: 'rgba(255,255,255,0.2)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconLabel: {
		fontSize: 32,
	},
});

export default MeetupCoverGradient;
