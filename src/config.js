// ── SET YOUR COMPUTER'S LOCAL IP HERE ─────────────────────
const LOCAL_IP = '192.168.1.42';
// ──────────────────────────────────────────────────────────

export const API_BASE_URL = `http://${LOCAL_IP}:3000/api`;
export const SOCKET_URL   = `http://${LOCAL_IP}:3000`;

export const DAYS = [
  { v: 0, s: 'Sun' }, { v: 1, s: 'Mon' }, { v: 2, s: 'Tue' },
  { v: 3, s: 'Wed' }, { v: 4, s: 'Thu' }, { v: 5, s: 'Fri' }, { v: 6, s: 'Sat' },
];

export const TYPES = [
  { value: 'alarm',       label: 'Alarm',       icon: 'alarm',          color: '#EF4444' },
  { value: 'drink_water', label: 'Drink Water', icon: 'water-drop',     color: '#3B82F6' },
  { value: 'exercise',    label: 'Exercise',    icon: 'fitness-center', color: '#F59E0B' },
  { value: 'reminder',    label: 'Reminder',    icon: 'notifications',  color: '#8B5CF6' },
  { value: 'medication',  label: 'Medication',  icon: 'medical-services', color: '#10B981' },
  { value: 'break',       label: 'Break',       icon: 'free-breakfast', color: '#6B7280' },
];

export const VIBES = [
  { value: 'buzz',      label: 'Quick Buzz',  emoji: '📳', pattern: [0, 200] },
  { value: 'heartbeat', label: 'Heartbeat',   emoji: '💓', pattern: [0,100,100,100,100,300] },
  { value: 'knock',     label: 'Knock Knock', emoji: '🚪', pattern: [0,150,100,150,400,150,100,150] },
  { value: 'wave',      label: 'Wave',        emoji: '👋', pattern: [0,50,50,100,50,150,50,200] },
  { value: 'urgent',    label: 'Urgent!',     emoji: '🚨', pattern: [0,80,40,80,40,80,40,80,40,80] },
  { value: 'love',      label: 'Love Tap',    emoji: '❤️', pattern: [0,100,200,100] },
];

export const LIGHT = {
  primary:'#6C3CE1', primaryLight:'#9B72F5', secondary:'#FF6B9D',
  bg:'#F8F6FF', card:'#FFFFFF', text:'#1A1A2E', muted:'#6B7280',
  success:'#10B981', warn:'#F59E0B', danger:'#EF4444',
  border:'#E5E7EB', input:'#FFFFFF', header:'#6C3CE1',
  tabbar:'#FFFFFF', modal:'#FFFFFF', online:'#10B981', offline:'#9CA3AF',
};

export const DARK = {
  primary:'#9B72F5', primaryLight:'#B89AF8', secondary:'#FF6B9D',
  bg:'#0F0F1A', card:'#1C1C2E', text:'#F1F1F5', muted:'#9CA3AF',
  success:'#34D399', warn:'#FBBF24', danger:'#F87171',
  border:'#2D2D42', input:'#252538', header:'#1C1C2E',
  tabbar:'#151525', modal:'#1C1C2E', online:'#34D399', offline:'#4B5563',
};
