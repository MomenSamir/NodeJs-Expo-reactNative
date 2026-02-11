import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

let socket = null;

export const connectSocket = (userId) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    query: { userId: String(userId) },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    socket.emit('register', { userId });
  });

  socket.on('disconnect', () => console.log('❌ Socket disconnected'));
  socket.on('connect_error', (e) => console.log('⚠️ Socket error:', e.message));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const onEvent = (event, callback) => {
  socket?.on(event, callback);
};

export const offEvent = (event) => {
  socket?.off(event);
};

export const emitComplete = (activityId, userId) => {
  socket?.emit('complete_activity', { activityId, userId });
};
