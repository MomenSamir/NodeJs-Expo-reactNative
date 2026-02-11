import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

let socket = null;

export function connectSocket(userId, username) {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    query: { userId: String(userId), username },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 10000,
  });
  socket.on('connect',       () => { console.log('✅ socket ok'); socket.emit('user_online', { userId, username }); });
  socket.on('disconnect',    () => console.log('❌ socket off'));
  socket.on('connect_error', e  => console.log('⚠️ socket err:', e.message));
  return socket;
}

export function disconnectSocket(userId) {
  socket?.emit('user_offline', { userId });
  socket?.disconnect();
  socket = null;
}

export const on  = (ev, cb) => socket?.on(ev, cb);
export const off = (ev)     => socket?.off(ev);
export const emit = (ev, d) => socket?.emit(ev, d);
