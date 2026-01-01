// src/components/EventCard.tsx
import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Meetup } from '../services/api/meetups';

type Props = {
  meetup: Meetup;
  onPress?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function EventCard({ meetup, onPress }: Props) {
  const navigation = useNavigation<any>();
  const participantsJoined = meetup.participants?.length ?? 0;
  const hostMeta = meetup as Record<string, unknown>;
  const hostedCount = Number(hostMeta['hostMeetupCount'] ?? hostMeta['hostedCount'] ?? 0);
  const ratingRaw = hostMeta['hostRating'] ?? hostMeta['rating'];
  const rating = typeof ratingRaw === 'number' ? ratingRaw : undefined;
  const showRating = typeof rating === 'number' && hostedCount >= 3;
  const trustedHost = typeof rating === 'number' && hostedCount >= 5 && rating >= 4;
  const ratingDisplay = showRating && rating !== undefined ? rating.toFixed(1) : null;

  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const animateScale = (value: number) => {
    Animated.timing(scale, {
      toValue: value,
      duration: 140,
      useNativeDriver: true,
    }).start();
  };

  const handlePressIn = () => {
    setPressed(true);
    animateScale(0.97);
  };

  const handlePressOut = () => {
    setPressed(false);
    animateScale(1);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    navigation.navigate('MeetupDetail', { meetup });
  };

  return (
    <AnimatedPressable
      style={[styles.card, { transform: [{ scale }] }, pressed && styles.cardPressed]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>
          {meetup.title}
        </Text>
        {trustedHost && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Trusted Host</Text>
          </View>
        )}
      </View>
      <Text style={styles.meta}>{meetup.date}</Text>
      <Text style={styles.meta}>{meetup.area}</Text>
      <Text style={styles.participants}>
        {participantsJoined} / {meetup.maxParticipants} joined
      </Text>
      <View style={styles.hostRow}>
        <View style={styles.hostInfo}>
          <Text style={styles.hostLabel}>Hosted by</Text>
          <Text style={styles.hostName}>{meetup.organizerName || 'Yellow Club Host'}</Text>
          <Text style={styles.hostMeta}>
            Hosted {hostedCount} meetup{hostedCount === 1 ? '' : 's'}
          </Text>
        </View>
        {ratingDisplay ? (
          <View style={styles.ratingPill}>
            <Text style={styles.ratingText}>★ {ratingDisplay}</Text>
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFBEA',
    borderRadius: 16,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
        shadowColor: '#000000',
      },
    }),
  },
  cardPressed: {
    ...Platform.select({
      ios: { shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  badge: {
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFD400',
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    fontSize: 14,
    color: '#414141',
    marginBottom: 2,
  },
  participants: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 12,
  },
  hostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hostInfo: {
    flexShrink: 1,
  },
  hostLabel: {
    fontSize: 12,
    color: '#6A6A6A',
    marginBottom: 2,
  },
  hostName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },
  hostMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#6A6A6A',
  },
  ratingPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFF1B1',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
  },
});