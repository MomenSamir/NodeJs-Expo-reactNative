import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getActivities, completeActivity, getPoints, deleteActivity } from '../services/api';
import { connectSocket, disconnectSocket, on, off } from '../services/socket';
import { showNotif, buzz } from '../services/notifications';
import { TYPES, DAYS, VIBES } from '../config';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { C, dark, toggle } = useTheme();

  const [acts,    setActs]    = useState([]);
  const [pts,     setPts]     = useState({ user_points:0, partner_points:0, partner_username:'Partner' });
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [online,  setOnline]  = useState([]);

  const load = async () => {
    try {
      const [a, p] = await Promise.all([getActivities(), getPoints(user.user_id)]);
      setActs(a); setPts(p);
    } catch (e) { console.log(e.message); }
    finally { setLoading(false); setRefresh(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  useEffect(() => {
    connectSocket(user.user_id, user.username);

    on('online_users',       (list) => setOnline(list));
    on('user_joined',        ({ userId, username }) => setOnline(p => p.find(u=>u.userId===userId) ? p : [...p,{userId,username}]));
    on('user_left',          ({ userId }) => setOnline(p => p.filter(u=>u.userId!==userId)));
    on('activity_created',   () => load());
    on('activity_deleted',   () => load());
    on('activity_completed', () => load());
    on('points_updated',     () => getPoints(user.user_id).then(setPts));
    on('activity_reminder',  async (d) => {
      await showNotif('⏰ Activity Time!', d.name);
    });
    on('receive_vibration', ({ fromUsername, vibrationType }) => {
      const vib = VIBES.find(v => v.value === vibrationType);
      if (vib) {
        buzz(vib.pattern);
        showNotif(`${vib.emoji} ${fromUsername} sent you a ${vib.label}!`, '');
      }
    });

    return () => {
      ['online_users','user_joined','user_left','activity_created','activity_deleted',
       'activity_completed','points_updated','activity_reminder','receive_vibration'].forEach(off);
    };
  }, []);

  const getType  = (t) => TYPES.find(x => x.value === t) || TYPES[3];
  const dayLabel = (r) => {
    if (!r || r === '0123456') return 'Every day';
    if (r === '12345') return 'Weekdays';
    if (r === '06')    return 'Weekends';
    return r.split('').map(d => DAYS[+d]?.s).join(', ');
  };

  const partnerOnline = online.some(u => u.username === pts.partner_username);

  const doComplete = async (id) => {
    try { await completeActivity(id, user.user_id); await load(); Alert.alert('🎉', '+10 points!'); }
    catch { Alert.alert('Error', 'Failed'); }
  };

  const doDelete = (id) => Alert.alert('Delete?', 'Remove for both users?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await deleteActivity(id); load(); } },
  ]);

  const doLogout = () => Alert.alert('Logout?', '', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Logout', style: 'destructive', onPress: () => { disconnectSocket(user.user_id); logout(); } },
  ]);

  const renderItem = ({ item }) => {
    const type = getType(item.activity_type);
    const done = item.completed === 1 || item.completed === true;
    return (
      <View style={[ss(C).card, done && { opacity: 0.55 }]}>
        <View style={[ss(C).badge, { backgroundColor: type.color + '22' }]}>
          <MaterialIcons name={type.icon} size={24} color={type.color} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={[ss(C).cardTitle, done && { textDecorationLine:'line-through', color:C.muted }]}>{item.name}</Text>
          <Text style={ss(C).cardMeta}>{item.scheduled_time?.slice(0,5)} · {dayLabel(item.repeat_days)}</Text>
          {done && <Text style={[ss(C).cardMeta, { color: C.success, fontWeight:'600' }]}>✓ {item.completed_by}</Text>}
        </View>
        <View style={{ alignItems:'center', gap:6 }}>
          {done
            ? <MaterialIcons name="check-circle" size={26} color={C.success} />
            : <TouchableOpacity style={[ss(C).check, { backgroundColor: type.color }]} onPress={() => doComplete(item.id)}>
                <MaterialIcons name="check" size={18} color="#fff" />
              </TouchableOpacity>
          }
          <TouchableOpacity onPress={() => doDelete(item.id)}>
            <MaterialIcons name="delete-outline" size={18} color={C.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <View style={[ss(C).center, { backgroundColor: C.bg }]}><ActivityIndicator size="large" color={C.primary} /></View>;

  return (
    <View style={[ss(C).wrap]}>
      {/* Header */}
      <View style={[ss(C).header]}>
        <View>
          <Text style={ss(C).hello}>Hey {user.username} 👋</Text>
          <View style={{ flexDirection:'row', alignItems:'center', marginTop:4 }}>
            <View style={{ width:8, height:8, borderRadius:4, backgroundColor: partnerOnline ? C.online : C.offline, marginRight:6 }} />
            <Text style={ss(C).partnerTxt}>{pts.partner_username} is {partnerOnline ? 'online' : 'offline'}</Text>
          </View>
        </View>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <Switch value={dark} onValueChange={toggle}
            trackColor={{ false:'rgba(255,255,255,0.3)', true:'rgba(255,255,255,0.5)' }}
            thumbColor="#fff" style={{ transform:[{ scale:0.8 }] }} />
          <TouchableOpacity onPress={doLogout} style={ss(C).logBtn}>
            <MaterialIcons name="logout" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Points */}
      <View style={ss(C).ptsRow}>
        <View style={ss(C).ptsCard}>
          <Text style={ss(C).ptsLabel}>Your Points</Text>
          <Text style={ss(C).ptsVal}>{pts.user_points}</Text>
          <MaterialIcons name="star" size={14} color={C.primary} />
        </View>
        <View style={[ss(C).ptsCard, { backgroundColor:C.bg, borderWidth:1.5, borderColor:C.border }]}>
          <View style={{ flexDirection:'row', alignItems:'center' }}>
            <View style={{ width:7, height:7, borderRadius:4, backgroundColor: partnerOnline ? C.online : C.offline, marginRight:5 }} />
            <Text style={ss(C).ptsLabel}>{pts.partner_username}</Text>
          </View>
          <Text style={ss(C).ptsVal}>{pts.partner_points}</Text>
          <MaterialIcons name="star-border" size={14} color={C.primary} />
        </View>
      </View>

      {/* Quick actions */}
      <View style={ss(C).qRow}>
        {[
          { label:'Calendar', icon:'calendar-month', color:C.primary,    screen:'Calendar'  },
          { label:'Moments',  icon:'chat-bubble',    color:'#FF6B9D',    screen:'Moments'   },
          { label:'Buzz',     icon:'vibration',      color:C.warn,       screen:'Vibration' },
        ].map(btn => (
          <TouchableOpacity key={btn.label} style={ss(C).qBtn} onPress={() => navigation.navigate(btn.screen)}>
            <MaterialIcons name={btn.icon} size={22} color={btn.color} />
            <Text style={[ss(C).qTxt, { color: C.text }]}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <View style={ss(C).listHdr}>
        <Text style={ss(C).listTitle}>Activities</Text>
        <Text style={{ color: C.muted, fontSize:13 }}>{acts.length} total</Text>
      </View>

      <FlatList data={acts} keyExtractor={i => String(i.id)} renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal:14, paddingBottom:110 }}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} colors={[C.primary]} />}
        ListEmptyComponent={
          <View style={ss(C).empty}>
            <MaterialIcons name="event-note" size={64} color={C.border} />
            <Text style={[ss(C).emptyT, { color: C.text }]}>No activities yet</Text>
            <Text style={{ color: C.muted, marginTop:6 }}>Tap + to add one</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={[ss(C).fab, { backgroundColor: C.primary }]}
        onPress={() => navigation.navigate('AddActivity')}>
        <MaterialIcons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const ss = (C) => StyleSheet.create({
  wrap:       { flex:1, backgroundColor:C.bg },
  center:     { flex:1, justifyContent:'center', alignItems:'center' },
  header:     { backgroundColor:C.header, paddingTop:54, paddingBottom:18, paddingHorizontal:20, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  hello:      { fontSize:20, fontWeight:'bold', color:'#fff' },
  partnerTxt: { fontSize:13, color:'rgba(255,255,255,0.8)' },
  logBtn:     { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center' },
  ptsRow:     { flexDirection:'row', margin:14, gap:12 },
  ptsCard:    { flex:1, backgroundColor:C.card, borderRadius:16, padding:14, alignItems:'center', elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:6 },
  ptsLabel:   { fontSize:12, color:C.muted, marginBottom:4 },
  ptsVal:     { fontSize:30, fontWeight:'bold', color:C.primary },
  qRow:       { flexDirection:'row', paddingHorizontal:14, gap:10, marginBottom:10 },
  qBtn:       { flex:1, backgroundColor:C.card, borderRadius:14, alignItems:'center', paddingVertical:12, gap:4, elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:4 },
  qTxt:       { fontSize:12, fontWeight:'600' },
  listHdr:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:18, marginBottom:6 },
  listTitle:  { fontSize:17, fontWeight:'bold', color:C.text },
  card:       { backgroundColor:C.card, borderRadius:16, padding:14, flexDirection:'row', alignItems:'center', marginBottom:10, elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:5 },
  badge:      { width:48, height:48, borderRadius:14, justifyContent:'center', alignItems:'center', marginRight:12 },
  cardTitle:  { fontSize:15, fontWeight:'600', color:C.text, marginBottom:3 },
  cardMeta:   { fontSize:12, color:C.muted },
  check:      { width:34, height:34, borderRadius:17, justifyContent:'center', alignItems:'center' },
  fab:        { position:'absolute', bottom:26, right:22, width:58, height:58, borderRadius:29, justifyContent:'center', alignItems:'center', elevation:10, shadowColor:C.primary, shadowOffset:{width:0,height:6}, shadowOpacity:0.4, shadowRadius:12 },
  empty:      { alignItems:'center', paddingTop:60 },
  emptyT:     { fontSize:18, fontWeight:'bold', marginTop:14 },
});
