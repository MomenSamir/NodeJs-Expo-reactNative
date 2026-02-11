import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { createActivity } from '../services/api';
import { COLORS, ACTIVITY_TYPES } from '../config';

export default function AddActivityScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('reminder');
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an activity name');
      return;
    }

    const h = parseInt(hour);
    const m = parseInt(minute);
    if (isNaN(h) || h < 0 || h > 23) {
      Alert.alert('Error', 'Hour must be between 0 and 23');
      return;
    }
    if (isNaN(m) || m < 0 || m > 59) {
      Alert.alert('Error', 'Minute must be between 0 and 59');
      return;
    }

    const scheduledTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

    setLoading(true);
    try {
      await createActivity(user.user_id, name.trim(), scheduledTime, selectedType);
      Alert.alert('✅ Created!', 'Activity shared with your partner', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Activity Name */}
      <Text style={styles.label}>Activity Name</Text>
      <View style={styles.inputWrap}>
        <MaterialIcons name="edit" size={20} color={COLORS.textLight} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="e.g. Morning Water, Stretch Break"
          value={name}
          onChangeText={setName}
          placeholderTextColor={COLORS.textLight}
          maxLength={50}
        />
      </View>

      {/* Time Picker */}
      <Text style={styles.label}>Scheduled Time</Text>
      <View style={styles.timeRow}>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Hour (0-23)</Text>
          <TextInput
            style={styles.timeInput}
            value={hour}
            onChangeText={setHour}
            keyboardType="numeric"
            maxLength={2}
            placeholder="08"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        <Text style={styles.timeSep}>:</Text>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Minute (0-59)</Text>
          <TextInput
            style={styles.timeInput}
            value={minute}
            onChangeText={setMinute}
            keyboardType="numeric"
            maxLength={2}
            placeholder="00"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>
      <View style={styles.timePreview}>
        <MaterialIcons name="schedule" size={16} color={COLORS.primary} />
        <Text style={styles.timePreviewText}>
          {' '}Scheduled for {String(parseInt(hour) || 0).padStart(2, '0')}:{String(parseInt(minute) || 0).padStart(2, '0')}
        </Text>
      </View>

      {/* Activity Type */}
      <Text style={styles.label}>Activity Type</Text>
      <View style={styles.typeGrid}>
        {ACTIVITY_TYPES.map((type) => {
          const selected = selectedType === type.value;
          return (
            <TouchableOpacity
              key={type.value}
              style={[styles.typeCard, selected && { borderColor: type.color, backgroundColor: type.color + '15' }]}
              onPress={() => setSelectedType(type.value)}
            >
              <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                <MaterialIcons name={type.icon} size={26} color={type.color} />
              </View>
              <Text style={[styles.typeLabel, selected && { color: type.color, fontWeight: '700' }]}>
                {type.label}
              </Text>
              {selected && (
                <MaterialIcons name="check-circle" size={16} color={type.color} style={styles.typeCheck} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info box */}
      <View style={styles.infoBox}>
        <MaterialIcons name="info-outline" size={18} color={COLORS.primary} />
        <Text style={styles.infoText}>
          {'  '}Both you and your partner will be notified at the scheduled time. Complete activities to earn 10 points each!
        </Text>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <>
              <MaterialIcons name="add-circle" size={22} color="#fff" />
              <Text style={styles.btnText}>  CREATE ACTIVITY</Text>
            </>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10, marginTop: 20 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5,
    borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 14,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeBox: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, padding: 16 },
  timeLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 6 },
  timeInput: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center' },
  timeSep: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
  timePreview: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 10, backgroundColor: COLORS.primary + '15',
    padding: 10, borderRadius: 10,
  },
  timePreviewText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 2, borderColor: COLORS.border,
    padding: 16, alignItems: 'center',
  },
  typeIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  typeLabel: { fontSize: 13, color: COLORS.text, fontWeight: '500', textAlign: 'center' },
  typeCheck: { position: 'absolute', top: 10, right: 10 },
  infoBox: {
    flexDirection: 'row', backgroundColor: COLORS.primary + '10',
    borderRadius: 12, padding: 14, marginTop: 20, alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 20 },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    marginTop: 24, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});
