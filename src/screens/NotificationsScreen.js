import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getNotifications, markAsRead, markAllAsRead } from '../services/api';

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { C } = useTheme();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getNotifications(user.user_id);
      setNotifications(data);
    } catch (e) {
      console.log(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handlePress = async (item) => {
    // Mark as read
    if (!item.is_read) {
      await markAsRead(item.id);
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
    }

    // Navigate based on type
    if (item.type === 'moment_shared' && item.data?.moment_id) {
      navigation.navigate('Moments');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(user.user_id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      Alert.alert('✅', 'All marked as read');
    } catch {
      Alert.alert('Error', 'Failed to mark all read');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'activity_created': return { name: 'add-circle', color: C.primary };
      case 'activity_completed': return { name: 'check-circle', color: C.success };
      case 'moment_shared': return { name: 'chat-bubble', color: '#FF6B9D' };
      case 'vibration_sent': return { name: 'vibration', color: C.warn };
      default: return { name: 'notifications', color: C.muted };
    }
  };

  const formatTime = (ts) => {
    const now = new Date();
    const date = new Date(ts);
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }) => {
    const icon = getIcon(item.type);
    const isUnread = !item.is_read;
    
    return (
      <TouchableOpacity 
        onPress={() => handlePress(item)}
        style={[s.card, { backgroundColor: isUnread ? C.primary + '15' : C.card }]}>
        <View style={[s.iconBadge, { backgroundColor: icon.color + '22' }]}>
          <MaterialIcons name={icon.name} size={24} color={icon.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={[s.title, { color: C.text, fontWeight: isUnread ? '700' : '600' }]}>
              {item.title}
            </Text>
            {isUnread && <View style={[s.unreadDot, { backgroundColor: C.primary }]} />}
          </View>
          {item.body && (
            <Text style={[s.body, { color: C.muted }]} numberOfLines={2}>
              {item.body}
            </Text>
          )}
          <Text style={[s.time, { color: C.muted }]}>{formatTime(item.created_at)}</Text>
        </View>
        {item.type === 'moment_shared' && (
          <MaterialIcons name="chevron-right" size={20} color={C.muted} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={[s.center, { backgroundColor: C.bg }]}><ActivityIndicator size="large" color={C.primary} /></View>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header actions */}
      {unreadCount > 0 && (
        <View style={[s.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
          <Text style={{ color: C.text, fontSize: 14 }}>
            <Text style={{ fontWeight: '700' }}>{unreadCount}</Text> unread
          </Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={{ color: C.primary, fontSize: 14, fontWeight: '600' }}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={i => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        onRefresh={load}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialIcons name="notifications-none" size={80} color={C.border} />
            <Text style={[s.emptyT, { color: C.text }]}>No notifications yet</Text>
            <Text style={{ color: C.muted, marginTop: 6 }}>
              You'll see updates when your partner{'\n'}creates or completes activities
            </Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  card: { borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  iconBadge: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  title: { fontSize: 15, marginBottom: 2, flex: 1 },
  body: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyT: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 6 },
});
