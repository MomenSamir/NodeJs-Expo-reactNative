import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getProfile, updateBio, uploadAvatar } from '../services/api';
import { API_BASE_URL, TYPES } from '../config';

export default function ProfileScreen({ route }) {
  const { user } = useAuth();
  const { C } = useTheme();
  const userId = route.params?.userId || user.user_id;
  const isOwnProfile = userId === user.user_id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [bioText, setBioText] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const data = await getProfile(userId);
      setProfile(data);
      setBioText(data.bio || '');
    } catch (e) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(React.useCallback(() => { load(); }, [userId]));

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      await updateBio(userId, bioText);
      setProfile(p => ({ ...p, bio: bioText }));
      setEditMode(false);
      Alert.alert('✅ Saved!', 'Bio updated');
    } catch {
      Alert.alert('Error', 'Failed to save bio');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        const { avatar_url } = await uploadAvatar(userId, result.assets[0].uri);
        setProfile(p => ({ ...p, avatar_url }));
        Alert.alert('✅ Uploaded!', 'Profile photo updated');
      } catch {
        Alert.alert('Error', 'Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  };

  if (loading) return <View style={[s.center, { backgroundColor:C.bg }]}><ActivityIndicator size="large" color={C.primary} /></View>;
  if (!profile) return <View style={[s.center, { backgroundColor:C.bg }]}><Text style={{ color:C.text }}>Profile not found</Text></View>;

  const getTypeInfo = (type) => TYPES.find(t => t.value === type) || TYPES[3];
  const topType = profile.stats?.top_activity_type ? getTypeInfo(profile.stats.top_activity_type) : null;
  const completionRate = profile.stats.total_activities > 0 
    ? Math.round((profile.stats.completed_count / profile.stats.total_activities) * 100) 
    : 0;

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bg }} contentContainerStyle={{ padding:20, paddingBottom:40 }}>
      {/* Avatar */}
      <View style={{ alignItems:'center', marginBottom:24 }}>
        <View style={[s.avatarWrap, { backgroundColor:C.card }]}>
          {profile.avatar_url ? (
            <Image source={{ uri: `${API_BASE_URL.replace('/api','')}${profile.avatar_url}` }} style={s.avatar} />
          ) : (
            <MaterialIcons name="person" size={80} color={C.muted} />
          )}
          {isOwnProfile && (
            <TouchableOpacity onPress={handlePickImage} disabled={uploading}
              style={[s.camBtn, { backgroundColor:C.primary }]}>
              {uploading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="camera-alt" size={20} color="#fff" />}
            </TouchableOpacity>
          )}
        </View>
        <Text style={[s.username, { color:C.text }]}>{profile.username}</Text>
        <Text style={{ color:C.muted, fontSize:13 }}>Member since {new Date(profile.created_at).toLocaleDateString()}</Text>
      </View>

      {/* Stats */}
      <View style={[s.statsCard, { backgroundColor:C.card }]}>
        <Text style={[s.sectionTitle, { color:C.text }]}>📊 Stats</Text>
        <View style={s.statsGrid}>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color:C.primary }]}>{profile.points}</Text>
            <Text style={{ color:C.muted, fontSize:12 }}>Points</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color:C.success }]}>{profile.stats.completed_count}</Text>
            <Text style={{ color:C.muted, fontSize:12 }}>Completed</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color:C.warn }]}>{completionRate}%</Text>
            <Text style={{ color:C.muted, fontSize:12 }}>Success Rate</Text>
          </View>
        </View>
        {topType && (
          <View style={{ marginTop:16, padding:14, backgroundColor:topType.color+'18', borderRadius:12, flexDirection:'row', alignItems:'center' }}>
            <View style={{ width:40, height:40, borderRadius:12, backgroundColor:topType.color+'33', justifyContent:'center', alignItems:'center', marginRight:12 }}>
              <MaterialIcons name={topType.icon} size={22} color={topType.color} />
            </View>
            <View>
              <Text style={{ color:C.muted, fontSize:12 }}>Most completed</Text>
              <Text style={{ color:topType.color, fontSize:16, fontWeight:'700' }}>{topType.label}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bio */}
      <View style={[s.bioCard, { backgroundColor:C.card }]}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <Text style={[s.sectionTitle, { color:C.text }]}>💭 Bio</Text>
          {isOwnProfile && !editMode && (
            <TouchableOpacity onPress={() => setEditMode(true)}>
              <MaterialIcons name="edit" size={20} color={C.primary} />
            </TouchableOpacity>
          )}
        </View>

        {editMode ? (
          <>
            <TextInput
              style={[s.bioInput, { backgroundColor:C.input, borderColor:C.border, color:C.text }]}
              placeholder="Tell your partner about yourself..."
              placeholderTextColor={C.muted}
              value={bioText}
              onChangeText={setBioText}
              multiline
              maxLength={300}
            />
            <View style={{ flexDirection:'row', gap:8, marginTop:12 }}>
              <TouchableOpacity onPress={() => { setEditMode(false); setBioText(profile.bio||''); }}
                style={[s.bioBtn, { backgroundColor:C.border, flex:1 }]}>
                <Text style={{ color:C.text, fontWeight:'600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveBio} disabled={saving}
                style={[s.bioBtn, { backgroundColor:C.primary, flex:1 }]}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color:'#fff', fontWeight:'600' }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={{ color: profile.bio ? C.text : C.muted, fontSize:15, lineHeight:22 }}>
            {profile.bio || (isOwnProfile ? 'Tap the edit icon to add a bio' : 'No bio yet')}
          </Text>
        )}
      </View>

      {/* Report */}
      <View style={[s.reportCard, { backgroundColor:C.card }]}>
        <Text style={[s.sectionTitle, { color:C.text }]}>📈 Activity Report</Text>
        <View style={s.reportRow}>
          <MaterialIcons name="check-circle" size={20} color={C.success} />
          <Text style={{ color:C.text, marginLeft:10, flex:1 }}>
            <Text style={{ fontWeight:'700' }}>{profile.stats.completed_count}</Text> activities completed
          </Text>
        </View>
        <View style={s.reportRow}>
          <MaterialIcons name="pending-actions" size={20} color={C.warn} />
          <Text style={{ color:C.text, marginLeft:10, flex:1 }}>
            <Text style={{ fontWeight:'700' }}>{profile.stats.total_activities - profile.stats.completed_count}</Text> activities pending
          </Text>
        </View>
        <View style={s.reportRow}>
          <MaterialIcons name="event" size={20} color={C.primary} />
          <Text style={{ color:C.text, marginLeft:10, flex:1 }}>
            <Text style={{ fontWeight:'700' }}>{profile.stats.total_activities}</Text> total activities created
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex:1, justifyContent:'center', alignItems:'center' },
  avatarWrap: { width:140, height:140, borderRadius:70, justifyContent:'center', alignItems:'center', marginBottom:16, elevation:6, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.15, shadowRadius:10 },
  avatar: { width:140, height:140, borderRadius:70 },
  camBtn: { position:'absolute', bottom:4, right:4, width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center', elevation:4 },
  username: { fontSize:24, fontWeight:'bold', marginBottom:4 },
  statsCard: { borderRadius:20, padding:20, marginBottom:16, elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 },
  sectionTitle: { fontSize:17, fontWeight:'bold', marginBottom:12 },
  statsGrid: { flexDirection:'row', justifyContent:'space-around' },
  statBox: { alignItems:'center' },
  statVal: { fontSize:32, fontWeight:'bold' },
  bioCard: { borderRadius:20, padding:20, marginBottom:16, elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 },
  bioInput: { borderWidth:1.5, borderRadius:14, padding:14, fontSize:15, minHeight:100, textAlignVertical:'top' },
  bioBtn: { borderRadius:12, paddingVertical:12, alignItems:'center' },
  reportCard: { borderRadius:20, padding:20, elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 },
  reportRow: { flexDirection:'row', alignItems:'center', paddingVertical:10, borderBottomWidth:1, borderBottomColor:'rgba(0,0,0,0.05)' },
});
