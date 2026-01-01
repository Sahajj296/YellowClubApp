// src/screens/Meetups/index.tsx
import React, { useCallback, useState } from 'react';
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
import { getMeetups, Meetup } from '../../services/api/meetups';
import EventCard from '../../components/EventCard';
import { useProfile } from '../../context/ProfileContext';

type DiscoveryMeetup = Meetup & {
  hostMeetupCount: number;
  hostRating?: number;
};

export default function MeetupsScreen() {
  const navigation = useNavigation<any>();
  const { currentUserProfile } = useProfile();
  const [meetups, setMeetups] = useState<DiscoveryMeetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeetups = useCallback(
    async ({ showSpinner = false }: { showSpinner?: boolean } = {}) => {
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        const data = await getMeetups();
        const hostTotals = data.reduce<Record<string, number>>((acc, item) => {
          const key = item.organizerId || item.organizerName;
          if (!key) return acc;
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});
        const enriched: DiscoveryMeetup[] = data.map(item => {
          const stats = (item as any).hostStats ?? {};
          const explicitHosted =
            typeof (item as any).hostedCount === 'number'
              ? (item as any).hostedCount
              : typeof stats.hostedCount === 'number'
              ? stats.hostedCount
              : typeof stats.totalHosted === 'number'
              ? stats.totalHosted
              : undefined;
          const hostMeetupCount =
            explicitHosted ??
            hostTotals[item.organizerId] ??
            hostTotals[item.organizerName] ??
            1;

          const rawRating =
            typeof (item as any).rating === 'number'
              ? (item as any).rating
              : typeof (item as any).hostRating === 'number'
              ? (item as any).hostRating
              : typeof stats.rating === 'number'
              ? stats.rating
              : undefined;

          return {
            ...item,
            hostMeetupCount,
            hostRating:
              typeof rawRating === 'number' && rawRating >= 0
                ? rawRating
                : undefined,
          };
        });
        setMeetups(enriched);
      } catch (err) {
        setError('We could not load meetups right now.');
        setMeetups([]);
      } finally {
        if (showSpinner) setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadMeetups({ showSpinner: true });
    }, [loadMeetups])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMeetups();
  }, [loadMeetups]);

  const handleCreateMeetup = useCallback(() => {
    navigation.navigate('CreateMeetup');
  }, [navigation]);

  const handleRetry = useCallback(() => {
    loadMeetups({ showSpinner: true });
  }, [loadMeetups]);

  const renderItem = useCallback(
    ({ item }: { item: DiscoveryMeetup }) => <EventCard meetup={item} />,
    []
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#000000" />
          <Text style={styles.loadingText}>Loading meetups…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={meetups}
        keyExtractor={item =>
          item.id ?? `${item.organizerId}-${item.createdAt}`
        }
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>We hit a snag</Text>
              <Text style={styles.errorSubtitle}>
                {error} Please try again.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No meetups yet</Text>
              <Text style={styles.emptySubtitle}>
                Check back soon or host a meetup for fellow members.
              </Text>
              {currentUserProfile?.role === 'organizer' && (
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={handleCreateMeetup}
                >
                  <Text style={styles.emptyCtaText}>Create Meetup</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={<View style={styles.footerSpacer} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFD400',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  separator: {
    height: 16,
  },
  footerSpacer: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  errorContainer: {
    backgroundColor: '#FFF0D0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#4A4A4A',
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFD400',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#323232',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  emptyCta: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  emptyCtaText: {
    color: '#FFD400',
    fontSize: 15,
    fontWeight: '600',
  },
});