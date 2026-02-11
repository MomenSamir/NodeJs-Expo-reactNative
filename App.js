import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth }   from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { requestPermissions }      from './src/services/notifications';
import LoginScreen       from './src/screens/LoginScreen';
import HomeScreen        from './src/screens/HomeScreen';
import AddActivityScreen from './src/screens/AddActivityScreen';
import CalendarScreen    from './src/screens/CalendarScreen';
import MomentsScreen     from './src/screens/MomentsScreen';
import VibrationScreen   from './src/screens/VibrationScreen';

const Stack = createNativeStackNavigator();

function Nav() {
  const { user, loading } = useAuth();
  const { C, dark }       = useTheme();

  useEffect(() => { requestPermissions(); }, []);

  const theme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: { ...(dark ? DarkTheme : DefaultTheme).colors, background:C.bg, card:C.tabbar, text:C.text, border:C.border, primary:C.primary },
  };

  const hOpts = { headerStyle:{ backgroundColor:C.header }, headerTintColor:'#fff', headerTitleStyle:{ fontWeight:'bold' } };

  if (loading) return null;

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown:false }}>
        {!user
          ? <Stack.Screen name="Login" component={LoginScreen} />
          : <>
              <Stack.Screen name="Home"        component={HomeScreen} />
              <Stack.Screen name="AddActivity" component={AddActivityScreen} options={{ headerShown:true, title:'New Activity', ...hOpts }} />
              <Stack.Screen name="Calendar"    component={CalendarScreen}    options={{ headerShown:true, title:'Calendar',     ...hOpts }} />
              <Stack.Screen name="Moments"     component={MomentsScreen}     options={{ headerShown:true, title:'Shared Moments', ...hOpts }} />
              <Stack.Screen name="Vibration"   component={VibrationScreen}   options={{ headerShown:true, title:'Send a Buzz',  ...hOpts }} />
            </>
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Nav />
      </AuthProvider>
    </ThemeProvider>
  );
}
