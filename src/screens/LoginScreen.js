import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { login, register } from '../services/api';
import { COLORS } from '../config';

export default function LoginScreen() {
  const { saveUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      const data = isLogin
        ? await login(username.trim(), password)
        : await register(username.trim(), password);
      await saveUser(data);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Connection failed. Check your IP in config.js';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="people" size={48} color="#fff" />
          </View>
          <Text style={styles.title}>Shared Activity</Text>
          <Text style={styles.subtitle}>Stay in sync with your partner</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Username */}
          <View style={styles.inputWrap}>
            <MaterialIcons name="person" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <MaterialIcons name="lock" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholderTextColor={COLORS.textLight}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <MaterialIcons
                name={showPass ? 'visibility-off' : 'visibility'}
                size={20} color={COLORS.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{isLogin ? 'LOGIN' : 'REGISTER'}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Test accounts hint */}
        <View style={styles.hint}>
          <MaterialIcons name="info-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.hintText}>  Test: user1 / password123  or  user2 / password123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  card: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: 24, shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  tabs: { flexDirection: 'row', marginBottom: 24, backgroundColor: COLORS.background, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontWeight: '600', color: COLORS.textLight },
  tabTextActive: { color: '#fff' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  hint: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12, borderRadius: 12,
  },
  hintText: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
});
