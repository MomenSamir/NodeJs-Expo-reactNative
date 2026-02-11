import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { login, register } from '../services/api';

export default function LoginScreen() {
  const { saveUser }  = useAuth();
  const { C }         = useTheme();
  const [tab, setTab] = useState(0);           // 0=login 1=register
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user.trim() || !pass.trim()) { Alert.alert('Error', 'Fill in all fields'); return; }
    setBusy(true);
    try {
      const data = tab === 0 ? await login(user.trim(), pass) : await register(user.trim(), pass);
      await saveUser(data);
    } catch (e) {
      const msg = e?.response?.data?.error || 'Connection failed.\nCheck LOCAL_IP in src/config.js';
      Alert.alert('Error', msg);
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor: C.primary }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.hero}>
          <View style={[s.ring, { backgroundColor:'rgba(255,255,255,0.2)' }]}>
            <MaterialIcons name="favorite" size={52} color="#fff" />
          </View>
          <Text style={s.title}>Shared Activity</Text>
          <Text style={s.sub}>Stay in sync with your partner</Text>
        </View>

        <View style={[s.card, { backgroundColor: C.card }]}>
          <View style={[s.tabs, { backgroundColor: C.bg }]}>
            {['Login','Register'].map((t,i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={[s.tab, tab===i && { backgroundColor: C.primary }]}>
                <Text style={[s.tabTxt, { color: tab===i ? '#fff' : C.muted }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[s.row, { borderColor: C.border, backgroundColor: C.input }]}>
            <MaterialIcons name="person-outline" size={20} color={C.muted} />
            <TextInput style={[s.inp, { color: C.text }]} placeholder="Username"
              placeholderTextColor={C.muted} value={user} onChangeText={setUser} autoCapitalize="none" />
          </View>

          <View style={[s.row, { borderColor: C.border, backgroundColor: C.input }]}>
            <MaterialIcons name="lock-outline" size={20} color={C.muted} />
            <TextInput style={[s.inp, { color: C.text, flex:1 }]} placeholder="Password"
              placeholderTextColor={C.muted} value={pass} onChangeText={setPass} secureTextEntry={!show} />
            <TouchableOpacity onPress={() => setShow(v => !v)}>
              <MaterialIcons name={show ? 'visibility-off' : 'visibility'} size={20} color={C.muted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={submit} disabled={busy}
            style={[s.btn, { backgroundColor: C.primary, opacity: busy ? 0.7 : 1 }]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>{tab===0 ? 'LOGIN' : 'REGISTER'}</Text>}
          </TouchableOpacity>
        </View>

        <Text style={s.hint}>Test accounts: user1 / password123</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll:  { flexGrow:1, justifyContent:'center', padding:24 },
  hero:    { alignItems:'center', marginBottom:32 },
  ring:    { width:96, height:96, borderRadius:48, justifyContent:'center', alignItems:'center', marginBottom:16 },
  title:   { fontSize:28, fontWeight:'bold', color:'#fff', marginBottom:6 },
  sub:     { fontSize:15, color:'rgba(255,255,255,0.8)' },
  card:    { borderRadius:24, padding:24, elevation:8, shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.15, shadowRadius:16 },
  tabs:    { flexDirection:'row', borderRadius:12, padding:4, marginBottom:20 },
  tab:     { flex:1, paddingVertical:10, borderRadius:10, alignItems:'center' },
  tabTxt:  { fontWeight:'700', fontSize:14 },
  row:     { flexDirection:'row', alignItems:'center', borderWidth:1.5, borderRadius:12, paddingHorizontal:14, paddingVertical:13, marginBottom:14, gap:10 },
  inp:     { flex:1, fontSize:16 },
  btn:     { borderRadius:12, paddingVertical:16, alignItems:'center', marginTop:6 },
  btnTxt:  { color:'#fff', fontSize:16, fontWeight:'bold', letterSpacing:0.8 },
  hint:    { textAlign:'center', marginTop:20, color:'rgba(255,255,255,0.65)', fontSize:13 },
});
