import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createActivity } from '../services/api';
import { TYPES, DAYS } from '../config';

export default function AddActivityScreen({ navigation }) {
  const { user }   = useAuth();
  const { C }      = useTheme();
  const [name, setName]   = useState('');
  const [type, setType]   = useState('reminder');
  const [hour, setHour]   = useState('08');
  const [min,  setMin]    = useState('00');
  const [days, setDays]   = useState([0,1,2,3,4,5,6]);
  const [busy, setBusy]   = useState(false);

  const toggle = (d) => setDays(p => p.includes(d) ? p.filter(x=>x!==d) : [...p,d].sort((a,b)=>a-b));

  const submit = async () => {
    if (!name.trim()) { Alert.alert('Error','Enter a name'); return; }
    if (!days.length) { Alert.alert('Error','Pick at least one day'); return; }
    const h = parseInt(hour), m = parseInt(min);
    if (isNaN(h)||h<0||h>23) { Alert.alert('Error','Hour 0-23'); return; }
    if (isNaN(m)||m<0||m>59) { Alert.alert('Error','Minute 0-59'); return; }
    setBusy(true);
    try {
      await createActivity({
        user_id: user.user_id, name: name.trim(),
        scheduled_time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`,
        activity_type: type, repeat_days: days.join(''),
      });
      Alert.alert('✅ Created!','Shared with your partner',[{ text:'OK', onPress:()=>navigation.goBack() }]);
    } catch(e) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed');
    } finally { setBusy(false); }
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bg }} contentContainerStyle={{ padding:20, paddingBottom:48 }}>
      <Text style={s.lbl(C)}>Name</Text>
      <View style={s.row(C)}>
        <MaterialIcons name="edit" size={20} color={C.muted} />
        <TextInput style={[s.inp, { color:C.text }]} placeholder="e.g. Morning walk" placeholderTextColor={C.muted}
          value={name} onChangeText={setName} maxLength={50} />
      </View>

      <Text style={s.lbl(C)}>Time</Text>
      <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
        {[['Hour (0–23)', hour, setHour], ['Min (0–59)', min, setMin]].map(([lbl, val, set], i) => (
          <View key={i} style={[s.tBox(C), { flex:1 }]}>
            <Text style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{lbl}</Text>
            <TextInput style={{ fontSize:32, fontWeight:'bold', color:C.primary, textAlign:'center' }}
              value={val} onChangeText={set} keyboardType="numeric" maxLength={2} />
          </View>
        ))}
        <Text style={{ fontSize:32, fontWeight:'bold', color:C.text }}>:</Text>
      </View>

      <Text style={s.lbl(C)}>Repeat</Text>
      <View style={{ flexDirection:'row', gap:8, marginBottom:10 }}>
        {[['All',  [0,1,2,3,4,5,6]], ['Weekdays',[1,2,3,4,5]], ['Weekend',[0,6]]].map(([l,d]) => (
          <TouchableOpacity key={l} onPress={() => setDays(d)}
            style={{ backgroundColor:C.primary+'18', borderRadius:20, paddingHorizontal:12, paddingVertical:5 }}>
            <Text style={{ color:C.primary, fontSize:12, fontWeight:'600' }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
        {DAYS.map(d => {
          const on = days.includes(d.v);
          return (
            <TouchableOpacity key={d.v} onPress={() => toggle(d.v)}
              style={{ width:42, height:42, borderRadius:21, borderWidth:1.5, justifyContent:'center', alignItems:'center',
                borderColor: on ? C.primary : C.border, backgroundColor: on ? C.primary : C.card }}>
              <Text style={{ fontSize:11, fontWeight:'700', color: on ? '#fff' : C.muted }}>{d.s}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={s.lbl(C)}>Type</Text>
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10 }}>
        {TYPES.map(t => {
          const sel = type === t.value;
          return (
            <TouchableOpacity key={t.value} onPress={() => setType(t.value)}
              style={{ width:'47%', backgroundColor: sel ? t.color+'18' : C.card, borderRadius:16, borderWidth:2,
                borderColor: sel ? t.color : C.border, padding:14, alignItems:'center' }}>
              <View style={{ width:46, height:46, borderRadius:14, backgroundColor: t.color+'22', justifyContent:'center', alignItems:'center', marginBottom:8 }}>
                <MaterialIcons name={t.icon} size={24} color={t.color} />
              </View>
              <Text style={{ fontSize:13, color: sel ? t.color : C.text, fontWeight: sel ? '700' : '500' }}>{t.label}</Text>
              {sel && <MaterialIcons name="check-circle" size={14} color={t.color} style={{ position:'absolute', top:8, right:8 }} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity onPress={submit} disabled={busy}
        style={{ backgroundColor:C.primary, borderRadius:14, paddingVertical:18, alignItems:'center',
          flexDirection:'row', justifyContent:'center', marginTop:28, opacity: busy ? 0.7 : 1,
          elevation:6, shadowColor:C.primary, shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:10 }}>
        {busy ? <ActivityIndicator color="#fff" /> : <>
          <MaterialIcons name="add-circle" size={22} color="#fff" />
          <Text style={{ color:'#fff', fontSize:16, fontWeight:'bold', marginLeft:8 }}>CREATE ACTIVITY</Text>
        </>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = {
  lbl: (C) => ({ fontSize:14, fontWeight:'700', color:C.text, marginBottom:10, marginTop:22 }),
  row: (C) => ({ flexDirection:'row', alignItems:'center', backgroundColor:C.input, borderRadius:14, borderWidth:1.5, borderColor:C.border, paddingHorizontal:14, paddingVertical:13, gap:10 }),
  inp: { flex:1, fontSize:16 },
  tBox: (C) => ({ backgroundColor:C.input, borderRadius:14, borderWidth:1.5, borderColor:C.border, padding:14 }),
};
