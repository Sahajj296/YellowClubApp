import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

export default function MeetupsScreen() {
  const navigation = useNavigation<any>();
  const { currentUserProfile } = useProfile();
  const {
    meetups,
    loading,
    refreshing,
    error,
    fetchMeetups,
    refreshMeetups,
  } = useMeetups();

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
        <ActivityIndicator color="#000" />
        <Text style={styles.loadingText}>Loading meetups…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={meetups}
        keyExtractor={item => item.id ?? item.createdAt}
        renderItem={({ item }) => <EventCard meetup={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshMeetups} tintColor="#000" />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>We hit a snag</Text>
              <Text style={styles.errorSubtitle}>{error}</Text>
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
});
