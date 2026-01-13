// src/screens/Meetups/index.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { getMeetups, type Meetup as NormalizedMeetup } from '../../services/api/meetups';
import { useProfile } from '../../context/ProfileContext';
import { mapToDiscoveryMeetup } from '../../utils/mapToDiscoveryMeetup';
import { AnyMeetup } from '../../types/meetup';
import { DiscoveryMeetup as DiscoveryMeetupShape } from '../../types/DiscoveryMeetup';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EventCard from '../../components/EventCard';

type DiscoveryMeetupWithStats = DiscoveryMeetupShape & {
  hostMeetupCount: number;
  hostRating?: number;
};

export default function MeetupsScreen() {
  const navigation = useNavigation<any>();
  const { currentUserProfile } = useProfile();
  const isOrganizer = currentUserProfile?.role === 'organizer';
  const [meetups, setMeetups] = useState<NormalizedMeetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const normalise = useCallback((input: AnyMeetup): NormalizedMeetup => {
		if (input.source === 'demo') {
			return {
				id: input.id,
				title: input.title,
				date: input.dateTime,
				area: input.location,
				maxParticipants: input.maxParticipants,
				description: input.description,
				organizerId: input.host.id,
				organizerName: input.host.name,
				createdAt: input.createdAt,
				participants: input.participants ?? [],
				tags: input.tags,
				source: input.source,
			};
		}
		return {
			id: input.id,
			title: input.title,
			date: input.date,
			area: input.area,
			maxParticipants: input.maxParticipants,
			description: input.description,
			organizerId: input.organizerId,
			organizerName: input.organizerName,
			createdAt: input.createdAt,
			participants: input.participants ?? [],
			tags: input.tags,
			source: input.source,
		};
	}, []);

  const loadMeetups = useCallback(
    async ({ showSpinner = false }: { showSpinner?: boolean } = {}) => {
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        const rawData = await getMeetups();
        const normalized = rawData.map(normalise);
        setMeetups(normalized);
      } catch (err) {
        setError('We could not load meetups right now.');
        setMeetups([]);
      } finally {
        if (showSpinner) setLoading(false);
        setRefreshing(false);
      }
    },
    [normalise],
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

  const discoveryMeetups = useMemo(() => meetups.map(mapToDiscoveryMeetup), [meetups]);

  const enrichedMeetups = useMemo<DiscoveryMeetupWithStats[]>(() => {
    if (!discoveryMeetups.length) {
      return [];
    }
    const hostTotals = discoveryMeetups.reduce<Record<string, number>>((acc, item) => {
      const key = item.organizerId || item.organizerName;
      if (!key) return acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return discoveryMeetups.map((item, index) => {
      const source = meetups[index] as any;
      const stats = source?.hostStats ?? {};
      const explicitHosted =
        typeof source?.hostedCount === 'number'
          ? source.hostedCount
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
        typeof source?.rating === 'number'
          ? source.rating
          : typeof source?.hostRating === 'number'
          ? source.hostRating
          : typeof stats.rating === 'number'
          ? stats.rating
          : undefined;

      return {
        ...item,
        hostMeetupCount,
        hostRating: typeof rawRating === 'number' && rawRating >= 0 ? rawRating : undefined,
      };
    });
  }, [discoveryMeetups, meetups]);

  const renderItem = useCallback(
    ({ item, index }: { item: DiscoveryMeetupWithStats; index: number }) => (
      <EventCard
        meetup={item}
        onPress={() => {
          const target = meetups[index];
          if (!target?.id) return;
          navigation.navigate('MeetupDetail', { meetupId: target.id });
        }}
      />
    ),
    [meetups, navigation],
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingContainer}>
          {[0, 1, 2].map(item => (
            <Animated.View key={`discovery-skeleton-${item}`} style={[styles.skeletonCard, { opacity: pulse }]} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={enrichedMeetups}
        keyExtractor={item => item.id}
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
          <View style={styles.headerStack}>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Explore Curated Meetups</Text>
              <Text style={styles.heroSubtitle}>
                Meaningful sessions hosted by trusted community leaders.
              </Text>
            </View>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>We hit a snag</Text>
                <Text style={styles.errorSubtitle}>
                  {error} Let’s try that again.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetry}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
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
      {isOrganizer && (
        <Pressable style={styles.fab} onPress={handleCreateMeetup}>
          <Ionicons name='add' size={28} color='#FFD400' style={styles.fabIcon} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFDF6',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
    flexGrow: 1,
    paddingTop: 16,
  },
  headerStack: {
    gap: 16,
    marginBottom: 12,
  },
  hero: {
    backgroundColor: '#FFF8D8',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#5C5C5C',
    lineHeight: 20,
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
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: '#FFFDF6',
  },
  skeletonCard: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: '#ECECEC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  errorContainer: {
    backgroundColor: '#FFF1DE',
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
    backgroundColor: '#1F1F1F',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabIcon: {
    marginBottom: 2,
  },
});