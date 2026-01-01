import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from '../context/ProfileContext';
import { useMeetups } from '../context/MeetupContext';
import PrimaryButton from '../components/PrimaryButton';

const MIN_PARTICIPANTS = 5;
const MAX_PARTICIPANTS = 10;

export default function CreateMeetupScreen() {
  const navigation = useNavigation<any>();
  const { currentUserProfile } = useProfile();
  const { addMeetup } = useMeetups();
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [date, setDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(MIN_PARTICIPANTS);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!area.trim()) errs.area = 'Area is required.';
    if (!date.trim()) errs.date = 'Date is required.';
    if (maxParticipants < MIN_PARTICIPANTS || maxParticipants > MAX_PARTICIPANTS) {
      errs.maxParticipants = `Max participants must be between ${MIN_PARTICIPANTS} and ${MAX_PARTICIPANTS}.`;
    }
    return errs;
  };

  const onPublish = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!currentUserProfile?.id) {
      Alert.alert('Profile required', 'Complete your profile before hosting a meetup.');
      return;
    }
    setSubmitting(true);
    try {
      const meetupPayload = {
        title: title.trim(),
        area: area.trim(),
        date,
        maxParticipants,
        description: description.trim(),
        organizerId: currentUserProfile.id,
        organizerName: currentUserProfile.name || currentUserProfile.email,
        host: {
          id: currentUserProfile.id,
          name: currentUserProfile.name || currentUserProfile.email,
          email: currentUserProfile.email,
        },
        tags: [],
      };
      await addMeetup(meetupPayload);
      setTitle('');
      setArea('');
      setDate('');
      setDescription('');
      navigation.navigate('MainTabs', {
        screen: 'Tabs',
        params: { screen: 'Explore' },
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to publish meetup. Please try again.');
      setErrors({ submit: 'Failed to publish. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const canPublish =
    currentUserProfile?.id && title.trim() && area.trim() && date.trim() && !submitting;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Create Meetup</Text>
      <TextInput
        style={styles.input}
        placeholder="Meetup Title"
        value={title}
        onChangeText={setTitle}
        maxLength={60}
      />
      {errors.title && <Text style={styles.error}>{errors.title}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Area / Location"
        value={area}
        onChangeText={setArea}
        maxLength={60}
      />
      {errors.area && <Text style={styles.error}>{errors.area}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Date & Time (e.g. 2024-06-01 18:00)"
        value={date}
        onChangeText={setDate}
        maxLength={30}
      />
      {errors.date && <Text style={styles.error}>{errors.date}</Text>}
      <View style={styles.sliderRow}>
        <Text style={styles.label}>Max Participants: {maxParticipants}</Text>
        <View style={styles.sliderBtns}>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => setMaxParticipants(Math.max(MIN_PARTICIPANTS, maxParticipants - 1))}
            disabled={maxParticipants === MIN_PARTICIPANTS}
          >
            <Text style={styles.sliderBtnText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => setMaxParticipants(Math.min(MAX_PARTICIPANTS, maxParticipants + 1))}
            disabled={maxParticipants === MAX_PARTICIPANTS}
          >
            <Text style={styles.sliderBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Description (optional)"
        value={description}
        onChangeText={t => t.length <= 300 && setDescription(t)}
        multiline
        maxLength={300}
      />
      <Text style={styles.chars}>{description.length}/300</Text>
      {errors.submit && <Text style={styles.error}>{errors.submit}</Text>}
      {errors.maxParticipants && <Text style={styles.error}>{errors.maxParticipants}</Text>}
      <PrimaryButton
        title="Publish Meetup"
        onPress={onPublish}
        // @ts-ignore
        disabled={!canPublish}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFD400',
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 18,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 10,
  },
  error: {
    color: '#B00020',
    fontSize: 13,
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#000',
    fontSize: 16,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 15,
    color: '#000',
    fontWeight: '600',
  },
  sliderBtns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderBtn: {
    backgroundColor: '#FFD400',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  sliderBtnText: {
    fontSize: 20,
    color: '#000',
    fontWeight: '700',
  },
  chars: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
});
