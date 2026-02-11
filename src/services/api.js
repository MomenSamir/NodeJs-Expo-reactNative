import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const login = async (username, password) => {
  const res = await api.post('/login', { username, password });
  return res.data;
};

export const register = async (username, password) => {
  const res = await api.post('/register', { username, password });
  return res.data;
};

export const getActivities = async () => {
  const res = await api.get('/activities');
  return res.data;
};

export const createActivity = async (userId, name, scheduledTime, activityType) => {
  const res = await api.post('/activities', {
    user_id: userId,
    name,
    scheduled_time: scheduledTime,
    activity_type: activityType,
  });
  return res.data;
};

export const completeActivity = async (activityId, userId) => {
  const res = await api.post(`/activities/${activityId}/complete`, { user_id: userId });
  return res.data;
};

export const getPoints = async (userId) => {
  const res = await api.get(`/points/${userId}`);
  return res.data;
};

export const deleteActivity = async (activityId) => {
  const res = await api.delete(`/activities/${activityId}`);
  return res.data;
};
