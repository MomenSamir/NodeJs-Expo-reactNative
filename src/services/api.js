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
