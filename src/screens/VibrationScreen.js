import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { emit } from '../services/socket';
import { buzz } from '../services/notifications';
import { VIBES } from '../config';

export default function VibrationScreen() {
  const { user }   = useAuth();
  const { C }      = useTheme();
  const [sent, setSent] = useState(null);
  const scale = useRef(new Animated.Value(1)).current;

  const pulse = () => Animated.sequence([
    Animated.timing(scale, { toValue:1.25, duration:100, useNativeDriver:true, easing:Easing.out(Easing.ease) }),
    Animated.timing(scale, { toValue:1,    duration:200, useNativeDriver:true }),
  ]).start();

  const send = (vib) => {
    buzz(vib.pattern);
    pulse();
    emit('send_vibration', { fromUserId: user.user_id, fromUsername: user.username, vibrationType: vib.value });
    setSent(vib);
    setTimeout(() => setSent(null), 2500);
  };

  return (
    <View style={{ flex:1, backgroundColor:C.bg, padding:16 }}>
      {/* Hero card */}
      <View style={[s.hero, { backgroundColor:C.card }]}>
        <Animated.View style={[s.phoneWrap, { backgroundColor: C.primary+'18', transform:[{ scale }] }]}>
          <MaterialIcons name="phone-android" size={52} color={C.primary} />
          <MaterialIcons name="vibration" size={24} color={C.warn} style={{ position:'absolute', bottom:8, right:8 }} />
        </Animated.View>
        <Text style={[s.heading, { color:C.text }]}>Send a Buzz</Text>
        <Text style={{ color:C.muted, textAlign:'center', fontSize:14, lineHeight:20 }}>
          Tap a pattern — your partner's phone vibrates instantly!
        </Text>
        {sent && (
          <View style={[s.sentBadge, { backgroundColor:C.success+'22' }]}>
            <Text style={{ color:C.success, fontWeight:'700', fontSize:14 }}>{sent.emoji} Sent "{sent.label}"!</Text>
          </View>
        )}
      </View>

      {/* Grid */}
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12, marginTop:4 }}>
        {VIBES.map(vib => (
          <TouchableOpacity key={vib.value} onPress={() => send(vib)} activeOpacity={0.75}
            style={[s.vibCard, { backgroundColor:C.card, borderColor:C.border }]}>
            <Text style={{ fontSize:38, marginBottom:8 }}>{vib.emoji}</Text>
            <Text style={{ fontSize:14, fontWeight:'700', color:C.text, marginBottom:8 }}>{vib.label}</Text>
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.primary+'18', paddingHorizontal:12, paddingVertical:4, borderRadius:20 }}>
              <MaterialIcons name="send" size={13} color={C.primary} />
              <Text style={{ color:C.primary, fontWeight:'600', fontSize:12, marginLeft:4 }}>Send</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[s.infoRow, { backgroundColor:C.card }]}>
        <MaterialIcons name="info-outline" size={16} color={C.muted} />
        <Text style={{ color:C.muted, fontSize:13, marginLeft:8 }}>Your phone previews it too before sending.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  hero:      { borderRadius:20, padding:24, alignItems:'center', marginBottom:16, elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:8 },
  phoneWrap: { width:88, height:88, borderRadius:44, justifyContent:'center', alignItems:'center', marginBottom:14 },
  heading:   { fontSize:22, fontWeight:'bold', marginBottom:8 },
  sentBadge: { marginTop:12, borderRadius:12, paddingHorizontal:16, paddingVertical:8 },
  vibCard:   { width:'47%', borderRadius:18, borderWidth:1.5, padding:18, alignItems:'center', elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:6 },
  infoRow:   { flexDirection:'row', alignItems:'center', borderRadius:12, padding:14, marginTop:16 },
});
