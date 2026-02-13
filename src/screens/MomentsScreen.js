import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMoments, sendMoment } from '../services/api';
import { on, off } from '../services/socket';

export default function MomentsScreen() {
  const { user }   = useAuth();
  const { C }      = useTheme();
  const insets     = useSafeAreaInsets();
  const ref        = useRef(null);
  const [items, setItems] = useState([]);
  const [text,  setText]  = useState('');
  const [loading, setLoad] = useState(true);
  const [busy, setBusy]   = useState(false);

  const load = async () => {
    try { setItems(await getMoments()); }
    catch (e) { console.log(e.message); }
    finally { setLoad(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  useEffect(() => {
    on('new_moment', (m) => {
      setItems(p => [...p, m]);
      setTimeout(() => ref.current?.scrollToEnd({ animated:true }), 80);
    });
    return () => off('new_moment');
  }, []);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      await sendMoment(user.user_id, t);
      setText('');
      setTimeout(() => ref.current?.scrollToEnd({ animated:true }), 80);
    } catch (e) { console.log(e.message); }
    finally { setBusy(false); }
  };

  const fmt = (ts) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const renderItem = ({ item, index }) => {
    const mine = item.user_id === user.user_id;
    const prev = index > 0 ? items[index-1] : null;
    const showName = !prev || prev.user_id !== item.user_id;
    return (
      <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom:4 }}>
        {!mine && showName && <Text style={{ fontSize:12, color:C.muted, marginLeft:4, marginBottom:3 }}>{item.username}</Text>}
        <View style={[s.bubble(C, mine)]}>
          <Text style={{ color: mine ? '#fff' : C.text, fontSize:15, lineHeight:22 }}>{item.text}</Text>
          <Text style={{ color: mine ? 'rgba(255,255,255,0.6)' : C.muted, fontSize:11, marginTop:4, textAlign:'right' }}>{fmt(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={{ flexDirection:'row', alignItems:'center', padding:12, backgroundColor:'#FF6B9D15', borderBottomWidth:1, borderBottomColor:C.border }}>
        <MaterialIcons name="favorite" size={15} color="#FF6B9D" />
        <Text style={{ fontSize:13, color:C.muted, marginLeft:6 }}>Share moments with your partner ✨</Text>
      </View>

      {loading
        ? <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" color={C.primary} /></View>
        : <FlatList ref={ref} data={items} keyExtractor={i=>String(i.id)} renderItem={renderItem}
            contentContainerStyle={{ padding:14, paddingBottom: insets.bottom + 8 }}
            onContentSizeChange={() => ref.current?.scrollToEnd({ animated:false })}
            ListEmptyComponent={
              <View style={{ alignItems:'center', paddingTop:80 }}>
                <Text style={{ fontSize:56 }}>💬</Text>
                <Text style={{ fontSize:20, fontWeight:'bold', color:C.text, marginTop:10 }}>No moments yet</Text>
                <Text style={{ color:C.muted, marginTop:6 }}>Share your first thought!</Text>
              </View>
            }
          />
      }

      <View style={{ flexDirection:'row', alignItems:'flex-end', padding:12, paddingBottom: insets.bottom + 12, borderTopWidth:1, borderTopColor:C.border, backgroundColor:C.card, gap:10 }}>
        <TextInput style={[s.inp(C), { flex:1 }]} placeholder="Share a moment..." placeholderTextColor={C.muted}
          value={text} onChangeText={setText} multiline maxLength={300} />
        <TouchableOpacity onPress={send} disabled={!text.trim()||busy}
          style={{ width:46, height:46, borderRadius:23, justifyContent:'center', alignItems:'center',
            backgroundColor: text.trim() ? C.primary : C.border }}>
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="send" size={22} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = {
  bubble: (C, mine) => ({
    maxWidth:'78%', borderRadius:18, paddingHorizontal:16, paddingVertical:10,
    backgroundColor: mine ? C.primary : C.card,
    borderBottomRightRadius: mine ? 4 : 18, borderBottomLeftRadius: mine ? 18 : 4,
    elevation:1, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:3,
  }),
  inp: (C) => ({
    borderWidth:1.5, borderRadius:22, paddingHorizontal:16, paddingVertical:10,
    fontSize:15, maxHeight:100, color:C.text, backgroundColor:C.input, borderColor:C.border,
  }),
};
