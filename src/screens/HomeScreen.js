import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getActivities, completeActivity, getPoints } from '../services/api';
import { connectSocket, disconnectSocket, onEvent, offEvent, emitComplete } from '../services/socket';
import { triggerAlert } from '../services/notifications';
import { COLORS, ACTIVITY_TYPES } from '../config';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [activities, setActivities] = useState([]);
  const [points, setPoints] = useState({ user_points: 0, partner_points: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reminderModal, setReminderModal] = useState(null);

  const loadData = async () => {
    try {
      const [acts, pts] = await Promise.all([
        getActivities(),
        getPoints(user.user_id),
      ]);
      setActivities(acts);
      setPoints(pts);
    } catch (e) {
      console.log('Load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  useEffect(() => {
    const sock = connectSocket(user.user_id);

    onEvent('activity_created', () => loadData());

    onEvent('activity_reminder', async (data) => {
      await triggerAlert(data.activity_type, '⏰ Activity Time!', data.name);
      setReminderModal(data);
    });

    onEvent('activity_completed', () => loadData());
    onEvent('points_updated', () => getPoints(user.user_id).then(setPoints));

    return () => {
      offEvent('activity_created');
      offEvent('activity_reminder');
      offEvent('activity_completed');
      offEvent('points_updated');
    };
  }, []);

  const handleComplete = async (activityId) => {
    try {
      await completeActivity(activityId, user.user_id);
      emitComplete(activityId, user.user_id);
      setReminderModal(null);
      await loadData();
      Alert.alert('🎉 Great job!', 'You earned 10 points!');
    } catch (e) {
      Alert.alert('Error', 'Failed to complete activity');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { disconnectSocket(); logout(); } },
    ]);
  };

  const getTypeInfo = (type) =>
    ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[3];

  const renderActivity = ({ item }) => {
    const typeInfo = getTypeInfo(item.activity_type);
    const completed = item.completed === 1 || item.completed === true;

    return (
      <View style={[styles.card, completed && styles.cardDone]}>
        <View style={[styles.iconBadge, { backgroundColor: typeInfo.color + '20' }]}>
          <MaterialIcons name={typeInfo.icon} size={26} color={typeInfo.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, completed && styles.strikethrough]}>
            {item.name}
          </Text>
          <View style={styles.cardMeta}>
            <MaterialIcons name="schedule" size={13} color={COLORS.textLight} />
            <Text style={styles.metaText}> {item.scheduled_time?.slice(0, 5)}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>{typeInfo.label}</Text>
          </View>
          {completed && (
            <Text style={styles.completedBy}>✓ Done by {item.completed_by}</Text>
          )}
        </View>
        {!completed ? (
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => handleComplete(item.id)}
          >
            <MaterialIcons name="check" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <MaterialIcons name="check-circle" size={28} color={COLORS.success} />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textLight }}>Connecting...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user.username}! 👋</Text>
          <Text style={styles.subGreeting}>Stay active with your partner</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Points */}
      <View style={styles.pointsRow}>
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>Your Points</Text>
          <Text style={styles.pointsValue}>{points.user_points}</Text>
          <MaterialIcons name="star" size={18} color={COLORS.primary} />
        </View>
        <View style={[styles.pointsCard, styles.pointsCardPartner]}>
          <Text style={styles.pointsLabel}>Partner</Text>
          <Text style={styles.pointsValue}>{points.partner_points}</Text>
          <MaterialIcons name="star-border" size={18} color={COLORS.primaryLight} />
        </View>
      </View>

      {/* Activity List */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Activities</Text>
        <Text style={styles.listCount}>{activities.length} total</Text>
      </View>

      <FlatList
        data={activities}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderActivity}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="event-note" size={72} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptyText}>Tap + to add your first shared activity</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddActivity')}
      >
        <MaterialIcons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Reminder Modal */}
      <Modal visible={!!reminderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>⏰</Text>
            <Text style={styles.modalTitle}>Time for Activity!</Text>
            <Text style={styles.modalName}>{reminderModal?.name}</Text>
            <Text style={styles.modalType}>
              {getTypeInfo(reminderModal?.activity_type)?.label}
            </Text>
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => handleComplete(reminderModal?.id)}
            >
              <Text style={styles.modalDoneText}>✓ Mark as Done (+10 pts)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalLaterBtn}
              onPress={() => setReminderModal(null)}
            >
              <Text style={styles.modalLaterText}>Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  pointsRow: { flexDirection: 'row', margin: 16, gap: 12 },
  pointsCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    alignItems: 'center', shadowColor: '#6C3CE1',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  pointsCardPartner: { backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: COLORS.border },
  pointsLabel: { fontSize: 13, color: COLORS.textLight, marginBottom: 4 },
  pointsValue: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, marginBottom: 8,
  },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  listCount: { fontSize: 14, color: COLORS.textLight },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardDone: { opacity: 0.65 },
  iconBadge: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  strikethrough: { textDecorationLine: 'line-through', color: COLORS.textLight },
  cardMeta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, color: COLORS.textLight },
  dot: { color: COLORS.textLight, marginHorizontal: 6 },
  completedBy: { fontSize: 12, color: COLORS.success, fontWeight: '600', marginTop: 4 },
  doneBtn: {
    backgroundColor: COLORS.primary, width: 36, height: 36,
    borderRadius: 18, justifyContent: 'center', alignItems: 'center',
  },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.textLight, marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 32, alignItems: 'center',
  },
  modalEmoji: { fontSize: 56, marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  modalName: { fontSize: 18, color: COLORS.primary, fontWeight: '600', marginBottom: 4 },
  modalType: { fontSize: 14, color: COLORS.textLight, marginBottom: 28 },
  modalDoneBtn: {
    backgroundColor: COLORS.success, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center', marginBottom: 12,
  },
  modalDoneText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalLaterBtn: { paddingVertical: 12 },
  modalLaterText: { color: COLORS.textLight, fontSize: 15 },
});
