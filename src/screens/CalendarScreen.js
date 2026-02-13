import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getActivities, createActivity } from '../services/api';
import { TYPES, DAYS } from '../config';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarScreen() {
  const { user }  = useAuth();
  const { C }     = useTheme();
  const today     = new Date();
  const [acts,    setActs]    = useState([]);
  const [load,    setLoad]    = useState(true);
  const [cur,     setCur]     = useState(new Date());
  const [selDay,  setSelDay]  = useState(today.getDate());
  
  // Quick create modal state
  const [showModal, setShowModal] = useState(false);
  const [newActName, setNewActName] = useState('');
  const [newActType, setNewActType] = useState('reminder');
  const [newActHour, setNewActHour] = useState('08');
  const [newActMin,  setNewActMin]  = useState('00');
  const [repeatMode, setRepeatMode] = useState('once'); // once, daily, weekly
  const [creating,   setCreating]   = useState(false);

  const loadData = async () => {
    try { setActs(await getActivities()); }
    catch (e) { console.log(e.message); }
    finally { setLoad(false); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const yr = cur.getFullYear(), mo = cur.getMonth();
  const dim = new Date(yr, mo+1, 0).getDate();
  const fwd = new Date(yr, mo, 1).getDay();
  const isCurMo = today.getMonth()===mo && today.getFullYear()===yr;

  const getType = (t) => TYPES.find(x=>x.value===t) || TYPES[3];
  const forDay  = (d) => {
    const wd = new Date(yr, mo, d).getDay();
    return acts.filter(a => (a.repeat_days||'0123456').includes(String(wd)));
  };

  const cells = [];
  for (let i=0;i<fwd;i++) cells.push(null);
  for (let d=1;d<=dim;d++) cells.push(d);
  while (cells.length%7!==0) cells.push(null);

  const selActs = forDay(selDay);

  // Long press handler
  const handleLongPress = (day) => {
    setSelDay(day);
    setNewActName('');
    setNewActType('reminder');
    setNewActHour('08');
    setNewActMin('00');
    setRepeatMode('once');
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!newActName.trim()) { Alert.alert('Error','Enter activity name'); return; }
    const h = parseInt(newActHour), m = parseInt(newActMin);
    if (isNaN(h)||h<0||h>23) { Alert.alert('Error','Hour 0-23'); return; }
    if (isNaN(m)||m<0||m>59) { Alert.alert('Error','Minute 0-59'); return; }

    const selectedDate = new Date(yr, mo, selDay);
    const selectedDayOfWeek = selectedDate.getDay();
    
    let repeatDays = '0123456'; // default: all days
    if (repeatMode === 'once') {
      repeatDays = String(selectedDayOfWeek); // only this day of week
    } else if (repeatMode === 'weekly') {
      repeatDays = String(selectedDayOfWeek); // every week on this day
    }

    setCreating(true);
    try {
      await createActivity({
        user_id: user.user_id,
        name: newActName.trim(),
        scheduled_time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`,
        activity_type: newActType,
        repeat_days: repeatDays,
      });
      setShowModal(false);
      await loadData();
      Alert.alert('✅ Created!', `Activity added to ${repeatMode === 'once' ? 'this day' : repeatMode === 'weekly' ? 'every week' : 'every day'}`);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed');
    } finally { setCreating(false); }
  };

  if (load) return <View style={[st.center, { backgroundColor:C.bg }]}><ActivityIndicator size="large" color={C.primary} /></View>;

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bg }} contentContainerStyle={{ padding:16, paddingBottom:40 }}>
      {/* Nav */}
      <View style={st.nav}>
        <TouchableOpacity onPress={() => setCur(new Date(yr,mo-1,1))} style={[st.navBtn, { backgroundColor:C.card }]}>
          <MaterialIcons name="chevron-left" size={28} color={C.primary} />
        </TouchableOpacity>
        <Text style={[st.monthTxt, { color:C.text }]}>{MONTHS[mo]} {yr}</Text>
        <TouchableOpacity onPress={() => setCur(new Date(yr,mo+1,1))} style={[st.navBtn, { backgroundColor:C.card }]}>
          <MaterialIcons name="chevron-right" size={28} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Hint */}
      <View style={[st.hint, { backgroundColor:C.primary+'18' }]}>
        <MaterialIcons name="touch-app" size={16} color={C.primary} />
        <Text style={[st.hintTxt, { color:C.primary }]}>  Long press any day to create activity</Text>
      </View>

      {/* Day names */}
      <View style={st.dayLabels}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <Text key={d} style={{ flex:1, textAlign:'center', fontSize:12, fontWeight:'600', color:C.muted }}>{d}</Text>)}
      </View>

      {/* Grid */}
      <View style={st.grid}>
        {cells.map((d,i) => {
          if (!d) return <View key={`e${i}`} style={st.cell} />;
          const isToday = isCurMo && d===today.getDate();
          const isSel   = d===selDay;
          const dots    = forDay(d);
          return (
            <TouchableOpacity key={d} onPress={() => setSelDay(d)} onLongPress={() => handleLongPress(d)} delayLongPress={500}
              style={st.cell}>
              <View style={{ width:36, height:36, borderRadius:18, justifyContent:'center', alignItems:'center',
                backgroundColor: isSel ? C.primary : isToday ? C.primary+'22' : 'transparent' }}>
                <Text style={{ fontSize:14, fontWeight: (isToday||isSel)?'bold':'500',
                  color: isSel ? '#fff' : isToday ? C.primary : C.text }}>{d}</Text>
              </View>
              {dots.length>0 && (
                <View style={{ flexDirection:'row', gap:2, marginTop:1 }}>
                  {dots.slice(0,3).map((a,j) => <View key={j} style={{ width:4, height:4, borderRadius:2, backgroundColor:getType(a.activity_type).color }} />)}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day */}
      <View style={[st.selHeader, { backgroundColor:C.card, borderColor:C.border }]}>
        <MaterialIcons name="event" size={18} color={C.primary} />
        <Text style={[st.selTitle, { color:C.text }]}>  {MONTHS[mo]} {selDay} — {selActs.length} activit{selActs.length===1?'y':'ies'}</Text>
      </View>

      {selActs.length===0
        ? <View style={st.noAct}><MaterialIcons name="event-available" size={48} color={C.border} /><Text style={{ color:C.muted, marginTop:10 }}>Free day!</Text></View>
        : selActs.map(a => {
          const t = getType(a.activity_type);
          const done = a.completed===1||a.completed===true;
          return (
            <View key={a.id} style={[st.actCard, { backgroundColor:C.card, opacity: done?0.55:1 }]}>
              <View style={[st.actIcon, { backgroundColor:t.color+'22' }]}>
                <MaterialIcons name={t.icon} size={20} color={t.color} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={[st.actName, { color:C.text, textDecorationLine: done?'line-through':'none' }]}>{a.name}</Text>
                <Text style={[st.actMeta, { color:C.muted }]}>{a.scheduled_time?.slice(0,5)} · {t.label}</Text>
              </View>
              {done ? <MaterialIcons name="check-circle" size={22} color={C.success} /> : <View style={{ width:10, height:10, borderRadius:5, backgroundColor:t.color }} />}
            </View>
          );
        })
      }

      {/* Quick Create Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <View style={[st.modalCard, { backgroundColor:C.modal }]}>
            <View style={st.modalHeader}>
              <Text style={[st.modalTitle, { color:C.text }]}>Create Activity</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color={C.muted} />
              </TouchableOpacity>
            </View>

            <Text style={[st.modalLabel, { color:C.text }]}>Activity Name</Text>
            <TextInput style={[st.modalInput, { backgroundColor:C.input, borderColor:C.border, color:C.text }]}
              placeholder="e.g. Morning walk" placeholderTextColor={C.muted}
              value={newActName} onChangeText={setNewActName} maxLength={50} />

            <Text style={[st.modalLabel, { color:C.text }]}>Time</Text>
            <View style={{ flexDirection:'row', gap:10 }}>
              <TextInput style={[st.timeInput, { backgroundColor:C.input, borderColor:C.border, color:C.primary }]}
                placeholder="08" placeholderTextColor={C.muted} value={newActHour} onChangeText={setNewActHour}
                keyboardType="numeric" maxLength={2} />
              <Text style={{ fontSize:28, fontWeight:'bold', color:C.text, alignSelf:'center' }}>:</Text>
              <TextInput style={[st.timeInput, { backgroundColor:C.input, borderColor:C.border, color:C.primary }]}
                placeholder="00" placeholderTextColor={C.muted} value={newActMin} onChangeText={setNewActMin}
                keyboardType="numeric" maxLength={2} />
            </View>

            <Text style={[st.modalLabel, { color:C.text }]}>Repeat</Text>
            <View style={{ flexDirection:'row', gap:8 }}>
              {[['once','Once (this day)'], ['weekly',`Every ${DAYS[new Date(yr,mo,selDay).getDay()]?.s}`], ['daily','Every day']].map(([val,lbl]) => (
                <TouchableOpacity key={val} onPress={() => setRepeatMode(val)}
                  style={[st.repeatBtn, { backgroundColor: repeatMode===val ? C.primary : C.border }]}>
                  <Text style={{ color: repeatMode===val ? '#fff' : C.muted, fontSize:12, fontWeight:'600' }}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[st.modalLabel, { color:C.text }]}>Type</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
              {TYPES.slice(0,4).map(t => (
                <TouchableOpacity key={t.value} onPress={() => setNewActType(t.value)}
                  style={[st.typeBtn, { backgroundColor: newActType===t.value ? t.color+'22' : C.card, borderColor: newActType===t.value ? t.color : C.border }]}>
                  <MaterialIcons name={t.icon} size={18} color={t.color} />
                  <Text style={{ color: newActType===t.value ? t.color : C.text, fontSize:11, marginLeft:4 }}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleCreate} disabled={creating}
              style={[st.createBtn, { backgroundColor:C.primary, opacity: creating?0.7:1 }]}>
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={{ color:'#fff', fontSize:15, fontWeight:'bold' }}>CREATE</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  center:     { flex:1, justifyContent:'center', alignItems:'center' },
  nav:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  navBtn:     { width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center', elevation:2 },
  monthTxt:   { fontSize:20, fontWeight:'bold' },
  hint:       { flexDirection:'row', alignItems:'center', padding:10, borderRadius:10, marginBottom:12 },
  hintTxt:    { fontSize:13, fontWeight:'600' },
  dayLabels:  { flexDirection:'row', marginBottom:6 },
  grid:       { flexDirection:'row', flexWrap:'wrap', marginBottom:20 },
  cell:       { width:'14.28%', aspectRatio:1, justifyContent:'center', alignItems:'center', padding:2 },
  selHeader:  { flexDirection:'row', alignItems:'center', borderRadius:12, padding:14, marginBottom:12, borderWidth:1 },
  selTitle:   { fontSize:15, fontWeight:'700' },
  noAct:      { alignItems:'center', paddingVertical:28 },
  actCard:    { flexDirection:'row', alignItems:'center', borderRadius:14, padding:14, marginBottom:8, elevation:2 },
  actIcon:    { width:42, height:42, borderRadius:12, justifyContent:'center', alignItems:'center', marginRight:12 },
  actName:    { fontSize:15, fontWeight:'600', marginBottom:3 },
  actMeta:    { fontSize:12 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' },
  modalCard:   { borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:40 },
  modalHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  modalTitle:  { fontSize:20, fontWeight:'bold' },
  modalLabel:  { fontSize:14, fontWeight:'700', marginBottom:8, marginTop:16 },
  modalInput:  { borderWidth:1.5, borderRadius:12, paddingHorizontal:14, paddingVertical:12, fontSize:16 },
  timeInput:   { flex:1, borderWidth:1.5, borderRadius:12, paddingVertical:12, fontSize:24, fontWeight:'bold', textAlign:'center' },
  repeatBtn:   { flex:1, paddingVertical:8, borderRadius:10, alignItems:'center' },
  typeBtn:     { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:8, borderRadius:10, borderWidth:1.5 },
  createBtn:   { borderRadius:12, paddingVertical:16, alignItems:'center', marginTop:24 },
});
