import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useMeetups } from '../../context/MeetupContext';
import { useProfile } from '../../context/ProfileContext';
import EventCard from '../../components/EventCard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { mapToDiscoveryMeetup } from '../../utils/mapToDiscoveryMeetup';

export default function MeetupsScreen() {
  const navigation = useNavigation<any>();
  const { currentUserProfile } = useProfile();
  const isOrganizer = currentUserProfile?.role === 'organizer';
  const {
    meetups,
    loading,
    refreshing,
    error,
    fetchMeetups,
    refreshMeetups,
  } = useMeetups();

  const pulse = useRef(new Animated.Value(0.6)).current;

  const discoveryMeetups = useMemo(
    () => meetups.map(mapToDiscoveryMeetup),
    [meetups],
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useFocusEffect(
    useCallback(() => {
      if (!meetups.length) {
        fetchMeetups();
      }
    }, [fetchMeetups, meetups.length])
  );

  if (loading && !meetups.length) {
    return (
      <View style={styles.loadingContainer}>
        {[0, 1, 2].map(item => (
          <Animated.View key={`meetup-skeleton-${item}`} style={[styles.skeletonCard, { opacity: pulse }]} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={discoveryMeetups}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <EventCard
            meetup={item}
            onPress={() => {
              const target = meetups[index];
              if (!target?.id) return;
              navigation.navigate('MeetupDetail', { meetupId: target.id });
            }}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshMeetups} tintColor="#000" />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>We hit a snag</Text>
              <Text style={styles.errorSubtitle}>{'Couldn’t load meetups. Try again.'}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchMeetups}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No meetups yet</Text>
              <Text style={styles.emptySubtitle}>
                Check back soon or host the next experience for the club.
              </Text>
              {currentUserProfile?.role === 'organizer' && (
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => navigation.navigate('CreateMeetup')}
                >
                  <Text style={styles.emptyCtaText}>Create Meetup</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
      {isOrganizer && (
        <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateMeetup')}>
          <Ionicons name='add' size={28} color='#FFD400' style={styles.fabIcon} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFD400' },
  listContent: { paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 40 },
  separator: { height: 16 },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFD400',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  skeletonCard: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: '#EEEEEE',
  },
  loadingText: { marginTop: 12, fontSize: 15, fontWeight: '600', color: '#000' },
  errorContainer: {
    backgroundColor: '#FFF0D0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
  errorSubtitle: { fontSize: 13, color: '#4A4A4A', marginBottom: 12 },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: '#FFD400', fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, color: '#323232', textAlign: 'center', marginBottom: 20 },
  emptyCta: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyCtaText: { color: '#FFD400', fontSize: 15, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabIcon: {
    marginBottom: 2,
  },
});
