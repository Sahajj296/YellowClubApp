import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
};

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Yellow Club Launch Party',
    date: '25 Sep 2025',
    location: 'Bangalore',
  },
  {
    id: '2',
    title: 'Founders Meetup',
    date: '2 Oct 2025',
    location: 'Mumbai',
  },
  {
    id: '3',
    title: 'Live Music Night',
    date: '10 Oct 2025',
    location: 'Delhi',
  },
];

export default function EventsScreen() {
  const navigation = useNavigation<any>();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const renderItem = ({ item }: { item: Event }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
      onPress={() =>
        navigation.navigate('EventDetails', {
          id: item.id,
          title: item.title,
          date: item.date,
          location: item.location,
        })
      }
      key={item.id}
    >
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.metaGroup}>
        <Text style={styles.date}>{item.date}</Text>
        <Text style={styles.location}>{item.location}</Text>
      </View>
    </Pressable>
  );

  if (MOCK_EVENTS.length === 0) {
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
        <Text style={styles.emptyTitle}>No events available right now.</Text>
        <Text style={styles.emptySubtitle}>Check back soon — exciting events are coming.</Text>
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
        data={MOCK_EVENTS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
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
  list: {
    // No extra padding needed, handled by container
  },
  card: {
    backgroundColor: '#FFFBEA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
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
