import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getActivities } from '../services/api';
import { TYPES, DAYS } from '../config';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarScreen() {
  const { C }    = useTheme();
  const today    = new Date();
  const [acts,   setActs]   = useState([]);
  const [load,   setLoad]   = useState(true);
  const [cur,    setCur]    = useState(new Date());
  const [selDay, setSelDay] = useState(today.getDate());

  useFocusEffect(useCallback(() => {
    getActivities().then(a => { setActs(a); setLoad(false); });
  }, []));

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

  if (load) return <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:C.bg }}><ActivityIndicator size="large" color={C.primary} /></View>;

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bg }} contentContainerStyle={{ padding:16, paddingBottom:40 }}>
      {/* Nav */}
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <TouchableOpacity onPress={() => setCur(new Date(yr,mo-1,1))}
          style={{ width:40, height:40, borderRadius:20, backgroundColor:C.card, justifyContent:'center', alignItems:'center', elevation:2 }}>
          <MaterialIcons name="chevron-left" size={28} color={C.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize:20, fontWeight:'bold', color:C.text }}>{MONTHS[mo]} {yr}</Text>
        <TouchableOpacity onPress={() => setCur(new Date(yr,mo+1,1))}
          style={{ width:40, height:40, borderRadius:20, backgroundColor:C.card, justifyContent:'center', alignItems:'center', elevation:2 }}>
          <MaterialIcons name="chevron-right" size={28} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={{ flexDirection:'row', marginBottom:6 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <Text key={d} style={{ flex:1, textAlign:'center', fontSize:12, fontWeight:'600', color:C.muted }}>{d}</Text>)}
      </View>

      {/* Grid */}
      <View style={{ flexDirection:'row', flexWrap:'wrap', marginBottom:20 }}>
        {cells.map((d,i) => {
          if (!d) return <View key={`e${i}`} style={{ width:'14.28%', aspectRatio:1 }} />;
          const isToday = isCurMo && d===today.getDate();
          const isSel   = d===selDay;
          const dots    = forDay(d);
          return (
            <TouchableOpacity key={d} onPress={() => setSelDay(d)}
              style={{ width:'14.28%', aspectRatio:1, justifyContent:'center', alignItems:'center', padding:2 }}>
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
      <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:12, padding:14, marginBottom:12, borderWidth:1, borderColor:C.border }}>
        <MaterialIcons name="event" size={18} color={C.primary} />
        <Text style={{ fontSize:15, fontWeight:'700', color:C.text, marginLeft:8 }}>
          {MONTHS[mo]} {selDay} — {selActs.length} activit{selActs.length===1?'y':'ies'}
        </Text>
      </View>

      {selActs.length===0
        ? <View style={{ alignItems:'center', paddingVertical:28 }}>
            <MaterialIcons name="event-available" size={48} color={C.border} />
            <Text style={{ color:C.muted, marginTop:10 }}>Free day!</Text>
          </View>
        : selActs.map(a => {
          const t = getType(a.activity_type);
          const done = a.completed===1||a.completed===true;
          return (
            <View key={a.id} style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:14, padding:14, marginBottom:8, opacity: done?0.55:1, elevation:2 }}>
              <View style={{ width:42, height:42, borderRadius:12, backgroundColor:t.color+'22', justifyContent:'center', alignItems:'center', marginRight:12 }}>
                <MaterialIcons name={t.icon} size={20} color={t.color} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:15, fontWeight:'600', color:C.text, textDecorationLine: done?'line-through':'none' }}>{a.name}</Text>
                <Text style={{ fontSize:12, color:C.muted }}>{a.scheduled_time?.slice(0,5)} · {t.label}</Text>
              </View>
              {done ? <MaterialIcons name="check-circle" size={22} color={C.success} /> : <View style={{ width:10, height:10, borderRadius:5, backgroundColor:t.color }} />}
            </View>
          );
        })
      }
    </ScrollView>
  );
}
