import axios from 'axios';
import { API_BASE_URL } from '../config';

const http = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

export const login    = (u, p) => http.post('/auth/login',    { username: u, password: p }).then(r => r.data);
export const register = (u, p) => http.post('/auth/register', { username: u, password: p }).then(r => r.data);

export const getActivities  = ()      => http.get('/activities').then(r => r.data);
export const createActivity = (d)     => http.post('/activities', d).then(r => r.data);
export const completeActivity=(id,uid)=> http.post(`/activities/${id}/complete`, { user_id: uid }).then(r => r.data);
export const deleteActivity  = (id)   => http.delete(`/activities/${id}`).then(r => r.data);
export const getPoints       = (uid)  => http.get(`/points/${uid}`).then(r => r.data);

export const getMoments = ()         => http.get('/moments').then(r => r.data);
export const sendMoment = (uid, txt) => http.post('/moments', { user_id: uid, text: txt }).then(r => r.data);

// Profile
export const getProfile = (userId)   => http.get(`/profile/${userId}`).then(r => r.data);
export const updateBio  = (userId, bio) => http.put(`/profile/${userId}`, { bio }).then(r => r.data);
export const uploadAvatar = async (userId, imageUri) => {
  const formData = new FormData();
  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  
  formData.append('avatar', {
    uri: imageUri,
    name: filename,
    type,
  });
  
  return http.post(`/profile/${userId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

// Notifications
export const getNotifications = (userId) => http.get(`/notifications/${userId}`).then(r => r.data);
export const getUnreadCount   = (userId) => http.get(`/notifications/${userId}/unread-count`).then(r => r.data);
export const markAsRead       = (notificationId) => http.post(`/notifications/${notificationId}/read`).then(r => r.data);
export const markAllAsRead    = (userId) => http.post(`/notifications/${userId}/mark-all-read`).then(r => r.data);
