// src/screens/EventDetailsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useBookings } from '../store/BookingContext';

type EventDetailsParams = {
  title: string;
  date: string;
  location: string;
  description?: string;
  id: string;
  organizerName?: string;
  hostedCount?: number;
  rating?: number;
};

export default function EventDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {
    title,
    date,
    location,
    description,
    id,
    organizerName,
    hostedCount,
    rating,
  } = route.params as EventDetailsParams;
  const { bookings, addBooking } = useBookings();

  const [loading, setLoading] = useState(false);
  const [pressAnim] = useState(new Animated.Value(1));
  const isBooked = bookings.some(b => b.id === id);

  const totalHosted = hostedCount ?? 0;
  const showRating = typeof rating === 'number' && totalHosted >= 3;
  const trustedHost = showRating && totalHosted >= 5 && rating >= 4;

  const onBookEvent = async () => {
    if (!isBooked && !loading) {
      setLoading(true);
      addBooking({ id, title, date, location });
      navigation.navigate('BookingConfirmation', { title, date, location });
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.metaGroup}>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.location}>{location}</Text>
        </View>
        {organizerName && (
          <View style={styles.hostBlock}>
            <View style={styles.hostInfo}>
              <Text style={styles.hostLabel}>Hosted by</Text>
              <Text style={styles.hostName}>{organizerName}</Text>
              <Text style={styles.hostMeta}>
                Hosted {totalHosted} meetup{totalHosted === 1 ? '' : 's'}
              </Text>
            </View>
            {showRating && (
              <View style={styles.hostBadges}>
                <Text style={styles.hostRating}>★ {rating!.toFixed(1)}</Text>
                {trustedHost && (
                  <View style={styles.trustedPill}>
                    <Text style={styles.trustedText}>Trusted Host</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
        <View style={styles.exploreMoreContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Explore')}
          >
            <Text style={styles.exploreMoreText}>Explore more meetups →</Text>
          </TouchableOpacity>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            (!isBooked && !loading && pressed) && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            (isBooked || loading) && styles.primaryDisabled,
          ]}
          onPress={loading || isBooked ? undefined : onBookEvent}
          disabled={isBooked || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFD400" />
          ) : (
            <Text style={styles.primaryText}>
              {isBooked ? 'Already Booked' : 'Book Event'}
            </Text>
          )}
        </Pressable>
        {isBooked && (
          <Text style={styles.successNote}>You’re already booked for this experience.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD600',
    paddingHorizontal: 16,
    paddingTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFBEA',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 400,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: '#000000',
    marginBottom: 6,
  },
  metaGroup: {
    flexDirection: 'column',
    gap: 2,
    marginBottom: 10,
  },
  date: {
    fontSize: 14,
    color: '#000000',
    opacity: 0.7,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#000000',
    opacity: 0.7,
    marginBottom: 0,
  },
  hostBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  hostMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#6A6A6A',
  },
  hostBadges: {
    alignItems: 'flex-end',
  },
  hostRating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  trustedPill: {
    backgroundColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 6,
  },
  trustedText: {
    color: '#FFD400',
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
    color: '#000000',
    opacity: 0.7,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#000000',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryDisabled: {
    backgroundColor: '#CFCFCF',
  },
  primaryText: {
    color: '#FFD400',
    fontSize: 16,
    fontWeight: '600',
  },
  successNote: {
    marginTop: 12,
    fontSize: 13,
    color: '#1F5F3D',
    backgroundColor: '#E0F5E9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exploreMoreContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  exploreMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
});