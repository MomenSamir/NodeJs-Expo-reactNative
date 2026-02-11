import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { requestPermissions } from './src/services/notifications';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddActivityScreen from './src/screens/AddActivityScreen';
import { COLORS } from './src/config';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    requestPermissions();
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="AddActivity"
              component={AddActivityScreen}
              options={{
                headerShown: true,
                title: 'New Activity',
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerBackTitle: 'Back',
                presentation: 'card',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
