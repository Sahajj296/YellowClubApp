import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Animated } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useBookings } from '../store/BookingContext';
import { useMeetups } from '../context/MeetupContext';

export default function BookingsScreen() {
  const { bookings } = useBookings();
  const { myMeetups } = useMeetups();
  const navigation = useNavigation<any>();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const combined = useMemo(() => {
    const map = new Map<
      string,
      { id: string; title: string; date: string; location: string }
    >();
    myMeetups.forEach(meetup => {
      if (meetup.id) {
        map.set(meetup.id, {
          id: meetup.id,
          title: meetup.title,
          date: meetup.date,
          location: meetup.area,
        });
      }
    });
    bookings.forEach(booking => {
      if (booking?.id && !map.has(booking.id)) {
        map.set(booking.id, booking);
      }
    });
    return Array.from(map.values());
  }, [myMeetups, bookings]);

  if (combined.length === 0) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
          },
        ]}
      >
        <Text style={styles.emptyTitle}>You haven’t joined any meetups yet.</Text>
        <Text style={styles.emptySubtitle}>Explore meetups and book your first experience.</Text>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            { marginTop: 24 },
          ]}
          onPress={() =>
            navigation.dispatch(
              CommonActions.navigate({
                name: 'MainTabs',
                params: { screen: 'Tabs', params: { screen: 'Explore' } },
              })
            )
          }
        >
          <Text style={styles.primaryText}>Explore Meetups</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
        },
      ]}
    >
      <FlatList
        data={combined}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.metaGroup}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.location}>{item.location}</Text>
            </View>
          </View>
        )}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD400',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 48,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#000',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#000',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFD400',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#000',
    opacity: 0.7,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFBEA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: '#000',
    marginBottom: 6,
  },
  metaGroup: {
    flexDirection: 'column',
    gap: 2,
    marginBottom: 10,
  },
  date: {
    fontSize: 14,
    color: '#000',
    opacity: 0.7,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#000',
    opacity: 0.7,
    marginBottom: 0,
  },
});