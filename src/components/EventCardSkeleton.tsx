import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function EventCardSkeleton() {
	return (
		<View style={styles.card}>
			<View style={styles.image} />
			<View style={styles.body}>
				<View style={styles.hostRow}>
					<View style={styles.avatar} />
					<View style={styles.hostMeta}>
						<View style={styles.hostLabel} />
						<View style={styles.hostName} />
					</View>
					<View style={styles.badge} />
				</View>
				<View style={styles.title} />
				<View style={styles.meta} />
				<View style={styles.metaShort} />
				<View style={styles.tagsRow}>
					<View style={styles.tag} />
					<View style={styles.tag} />
					<View style={styles.tagHalf} />
				</View>
				<View style={styles.description} />
				<View style={styles.descriptionShort} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: 20,
		backgroundColor: '#FFFFFF',
		overflow: 'hidden',
	},
	image: {
		height: 160,
		backgroundColor: '#EFEFEF',
	},
	body: {
		padding: 18,
		gap: 14,
	},
	hostRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	avatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#E6E6E6',
	},
	hostMeta: {
		flex: 1,
		gap: 6,
	},
	hostLabel: {
		width: 60,
		height: 10,
		borderRadius: 6,
		backgroundColor: '#EFEFEF',
	},
	hostName: {
		width: 120,
		height: 12,
		borderRadius: 6,
		backgroundColor: '#EAEAEA',
	},
	badge: {
		width: 80,
		height: 22,
		borderRadius: 999,
		backgroundColor: '#F0F0F0',
	},
	title: {
		width: '80%',
		height: 16,
		borderRadius: 8,
		backgroundColor: '#E8E8E8',
	},
	meta: {
		width: '65%',
		height: 12,
		borderRadius: 6,
		backgroundColor: '#EEEEEE',
	},
	metaShort: {
		width: '45%',
		height: 12,
		borderRadius: 6,
		backgroundColor: '#F0F0F0',
	},
	tagsRow: {
		flexDirection: 'row',
		gap: 8,
	},
	tag: {
		width: 68,
		height: 20,
		borderRadius: 12,
		backgroundColor: '#F2F2F2',
	},
	tagHalf: {
		width: 52,
		height: 20,
		borderRadius: 12,
		backgroundColor: '#F5F5F5',
	},
	description: {
		width: '100%',
		height: 12,
		borderRadius: 6,
		backgroundColor: '#EDEDED',
	},
	descriptionShort: {
		width: '70%',
		height: 12,
		borderRadius: 6,
		backgroundColor: '#F1F1F1',
	},
});
