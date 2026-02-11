// ============================================================
//  IMPORTANT: Set your computer's local IP address here
//  Your phone and computer must be on the same WiFi network
//
//  How to find your IP:
//    Linux/Mac:  run  ip addr show  or  hostname -I
//    Windows:    run  ipconfig
//
//  Example: 192.168.1.100
// ============================================================

const LOCAL_IP = '192.168.1.42'; // <-- CHANGE THIS TO YOUR IP

export const API_BASE_URL = `http://${LOCAL_IP}:3000/api`;
export const SOCKET_URL = `http://${LOCAL_IP}:3000`;

export const COLORS = {
  primary: '#6C3CE1',
  primaryLight: '#9B72F5',
  secondary: '#FF6B9D',
  background: '#F8F6FF',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textLight: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E5E7EB',
};

export const ACTIVITY_TYPES = [
  { value: 'alarm',       label: 'Alarm',       icon: 'alarm',          color: '#EF4444' },
  { value: 'drink_water', label: 'Drink Water', icon: 'water',          color: '#3B82F6' },
  { value: 'exercise',    label: 'Exercise',    icon: 'fitness-center', color: '#F59E0B' },
  { value: 'reminder',    label: 'Reminder',    icon: 'notifications',  color: '#8B5CF6' },
  { value: 'medication',  label: 'Medication',  icon: 'medication',     color: '#10B981' },
  { value: 'break',       label: 'Take Break',  icon: 'free-breakfast', color: '#6B7280' },
];
