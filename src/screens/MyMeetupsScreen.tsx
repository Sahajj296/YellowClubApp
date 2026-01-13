import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DiscoveryMeetup } from '../types/DiscoveryMeetup';

const MyMeetupsScreen = () => {
  const navigation = useNavigation<any>();
  const [meetups, setMeetups] = useState<DiscoveryMeetup[]>([]);

  useEffect(() => {
    const fetchMeetups = async () => {
      // Your data fetching logic
      const response = await fetch('YOUR_API_ENDPOINT');
      const data = await response.json();
      setMeetups(data);
    };

    fetchMeetups();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={meetups}
        keyExtractor={(item) => item.id}
        renderItem={({ item: meetup }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('EventDetails', {
              id: meetup.id,
              title: meetup.title,
              date: meetup.date,
              location: meetup.area,
              description: meetup.description,
              organizerName: meetup.organizerName,
            })}
          >
            <Text style={styles.title}>{meetup.title}</Text>
            <Text style={styles.date}>{meetup.date}</Text>
            <Text style={styles.location}>{meetup.area}</Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    elevation: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
});

export default MyMeetupsScreen;