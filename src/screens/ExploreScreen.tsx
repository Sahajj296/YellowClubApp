import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useProfile } from '../context/ProfileContext';
import { useMeetups } from '../context/MeetupContext';
import Fab from '../components/Fab';
import EventCard from '../components/EventCard';
import { SkeletonList } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function ExploreScreen() {
  const navigation = useNavigation<any>();
  const { currentUserProfile } = useProfile();
  const isOrganizer = currentUserProfile?.role === 'organizer';
  const { meetups, loading, refreshing, fetchMeetups, refreshMeetups } = useMeetups();

  useFocusEffect(
    React.useCallback(() => {
      if (!meetups.length) {
        fetchMeetups();
      }
    }, [fetchMeetups, meetups.length]),
  );

  if (loading && !meetups.length) {
    return (
      <View style={styles.container}>
        <SkeletonList count={3} hasAvatar />
        {isOrganizer && (
          <Fab onPress={() => navigation.navigate('CreateMeetup')} />
        )}
      </View>
    );
  }

  if (!loading && !meetups.length) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No meetups yet"
          subtitle="Explore will light up soon. Until then, lead the way with a premium Yellow Club experience."
          ctaLabel={isOrganizer ? 'Host a Meetup' : 'Refresh'}
          onPress={
            isOrganizer
              ? () => navigation.navigate('CreateMeetup')
              : refreshMeetups
          }
        />
        {isOrganizer && (
          <Fab onPress={() => navigation.navigate('CreateMeetup')} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={meetups}
        keyExtractor={item => item.id ?? item.createdAt}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.cardWrapper,
              pressed && styles.cardPressed,
            ]}
            onPress={() => navigation.navigate('MeetupDetail', { meetup: item })}
          >
            <View pointerEvents="none">
              <EventCard meetup={item} />
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={refreshMeetups}
      />
      {isOrganizer && (
        <Fab onPress={() => navigation.navigate('CreateMeetup')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD400',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  listContent: {
    paddingBottom: 96,
    gap: 16,
  },
  cardWrapper: {
    borderRadius: 16,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
});
