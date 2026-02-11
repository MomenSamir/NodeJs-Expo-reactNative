import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('sa_user')
      .then(v => { if (v) setUser(JSON.parse(v)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveUser = async (data) => {
    await AsyncStorage.setItem('sa_user', JSON.stringify(data));
    setUser(data);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('sa_user');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, saveUser, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
