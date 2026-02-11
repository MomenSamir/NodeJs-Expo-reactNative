import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT, DARK } from '../config';

const Ctx = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('sa_theme').then(v => { if (v === '1') setDark(true); }).catch(() => {});
  }, []);

  const toggle = async () => {
    const next = !dark;
    setDark(next);
    await AsyncStorage.setItem('sa_theme', next ? '1' : '0');
  };

  return (
    <Ctx.Provider value={{ dark, toggle, C: dark ? DARK : LIGHT }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
