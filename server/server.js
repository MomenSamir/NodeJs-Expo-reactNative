const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const cron    = require('node-cron');
require('dotenv').config();

const db  = require('./config/database');
const app = express();
const srv = http.createServer(app);
const io  = new Server(srv, { cors:{ origin:'*' } });

app.use(cors());
app.use(express.json());

// userId(string) -> { socketId, username }
const online = new Map();
const broadcast = () => io.emit('online_users', Array.from(online.entries()).map(([userId,d])=>({ userId, username:d.username })));

// ── AUTH ──────────────────────────────────────────────────

app.post('/api/auth/register', async (req,res) => {
  try {
    const { username, password } = req.body;
    if (!username||!password) return res.status(400).json({ error:'Username and password required' });
    const hash = await bcrypt.hash(password, 10);
    const [r]  = await db.execute('INSERT INTO users (username,password) VALUES (?,?)', [username, hash]);
    res.status(201).json({ user_id:r.insertId, username });
  } catch(e) {
    res.status(e.code==='ER_DUP_ENTRY'?400:500).json({ error: e.code==='ER_DUP_ENTRY'?'Username taken':'Registration failed' });
  }
});

app.post('/api/auth/login', async (req,res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM users WHERE username=?', [username]);
    if (!rows.length || !await bcrypt.compare(password, rows[0].password))
      return res.status(401).json({ error:'Invalid credentials' });
    res.json({ user_id:rows[0].id, username:rows[0].username, points:rows[0].points });
  } catch { res.status(500).json({ error:'Login failed' }); }
});

// ── ACTIVITIES ────────────────────────────────────────────

app.get('/api/activities', async (req,res) => {
  try {
    const [rows] = await db.execute(
      'SELECT a.*,u.username AS creator_username FROM activities a JOIN users u ON a.user_id=u.id ORDER BY a.scheduled_time'
    );
    res.json(rows);
  } catch { res.status(500).json({ error:'Failed' }); }
});

app.post('/api/activities', async (req,res) => {
  try {
    const { user_id, name, scheduled_time, activity_type, repeat_days } = req.body;
    const [r] = await db.execute(
      'INSERT INTO activities (user_id,name,scheduled_time,activity_type,repeat_days) VALUES (?,?,?,?,?)',
      [user_id, name, scheduled_time, activity_type, repeat_days||'0123456']
    );
    const [rows] = await db.execute(
      'SELECT a.*,u.username AS creator_username FROM activities a JOIN users u ON a.user_id=u.id WHERE a.id=?',
      [r.insertId]
    );
    io.emit('activity_created', rows[0]);
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error:'Failed' }); }
});

app.post('/api/activities/:id/complete', async (req,res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    const [users] = await db.execute('SELECT username FROM users WHERE id=?', [user_id]);
    const uname   = users[0]?.username;
    await db.execute('UPDATE activities SET completed=1,completed_by=?,completed_at=NOW() WHERE id=?', [uname,id]);
    await db.execute('UPDATE users SET points=points+10 WHERE id=?', [user_id]);
    await db.execute('INSERT INTO activity_completions (activity_id,user_id,points_earned) VALUES (?,?,10)', [id,user_id]);
    io.emit('activity_completed', { activity_id:id, user_id, username:uname });
    io.emit('points_updated',     { user_id });
    res.json({ success:true, points_earned:10 });
  } catch { res.status(500).json({ error:'Failed' }); }
});

app.delete('/api/activities/:id', async (req,res) => {
  try {
    await db.execute('DELETE FROM activities WHERE id=?', [req.params.id]);
    io.emit('activity_deleted', { id:req.params.id });
    res.json({ success:true });
  } catch { res.status(500).json({ error:'Failed' }); }
});

// ── POINTS ────────────────────────────────────────────────

app.get('/api/points/:uid', async (req,res) => {
  try {
    const { uid } = req.params;
    const [mine]  = await db.execute('SELECT points,username FROM users WHERE id=?',    [uid]);
    const [other] = await db.execute('SELECT points,username FROM users WHERE id!=? LIMIT 1', [uid]);
    res.json({ user_points:mine[0]?.points??0, partner_points:other[0]?.points??0, partner_username:other[0]?.username??'Partner' });
  } catch { res.status(500).json({ error:'Failed' }); }
});

// ── MOMENTS ───────────────────────────────────────────────

app.get('/api/moments', async (req,res) => {
  try {
    const [rows] = await db.execute(
      'SELECT m.*,u.username FROM moments m JOIN users u ON m.user_id=u.id ORDER BY m.created_at LIMIT 100'
    );
    res.json(rows);
  } catch { res.status(500).json({ error:'Failed' }); }
});

app.post('/api/moments', async (req,res) => {
  try {
    const { user_id, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error:'Text required' });
    const [r] = await db.execute('INSERT INTO moments (user_id,text) VALUES (?,?)', [user_id, text.trim()]);
    const [rows] = await db.execute(
      'SELECT m.*,u.username FROM moments m JOIN users u ON m.user_id=u.id WHERE m.id=?', [r.insertId]
    );
    io.emit('new_moment', rows[0]);
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error:'Failed' }); }
});

// ── SOCKET.IO ─────────────────────────────────────────────

io.on('connection', (socket) => {
  socket.on('user_online', ({ userId, username }) => {
    online.set(String(userId), { socketId:socket.id, username });
    socket.broadcast.emit('user_joined', { userId, username });
    broadcast();
    console.log(`✅ ${username} online`);
  });

  socket.on('send_vibration', (data) => {
    console.log(`📳 ${data.fromUsername} → ${data.vibrationType}`);
    socket.broadcast.emit('receive_vibration', data);
  });

  socket.on('user_offline', ({ userId }) => {
    const info = online.get(String(userId));
    if (info) { online.delete(String(userId)); io.emit('user_left',{ userId, username:info.username }); broadcast(); }
  });

  socket.on('disconnect', () => {
    for (const [uid,info] of online) {
      if (info.socketId === socket.id) {
        online.delete(uid);
        io.emit('user_left', { userId:uid, username:info.username });
        broadcast();
        console.log(`❌ ${info.username} offline`);
        break;
      }
    }
  });
});

// ── CRON: activity reminders ──────────────────────────────

cron.schedule('* * * * *', async () => {
  try {
    const now  = new Date();
    const wd   = String(now.getDay());
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:00`;
    const [due] = await db.execute(
      'SELECT * FROM activities WHERE scheduled_time=? AND completed=0 AND repeat_days LIKE ?',
      [time, `%${wd}%`]
    );
    for (const a of due) {
      io.emit('activity_reminder', { id:a.id, name:a.name, activity_type:a.activity_type });
    }
    if (time === '00:00:00') {
      await db.execute('UPDATE activities SET completed=0,completed_by=NULL WHERE 1=1');
      console.log('🔄 Daily reset');
    }
  } catch(e) { console.error('cron:', e.message); }
});

// ── START ─────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
srv.listen(PORT, '0.0.0.0', () => console.log(`
╔══════════════════════════════════════╗
║  🚀 Server v4  —  port ${PORT}          ║
║  🟢 Online presence active           ║
║  📳 Vibration relay active           ║
║  💬 Moments feed active              ║
╚══════════════════════════════════════╝`));
