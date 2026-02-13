const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const cron    = require('node-cron');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
require('dotenv').config();

const db  = require('./config/database');
const app = express();
const srv = http.createServer(app);
const io  = new Server(srv, { cors:{ origin:'*' } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const online = new Map();
const broadcast = () => io.emit('online_users', Array.from(online.entries()).map(([userId,d])=>({ userId, username:d.username })));

// Helper: Create notification
async function createNotification(userId, fromUserId, type, title, body, data = null) {
  try {
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, from_user_id, type, title, body, data) VALUES (?,?,?,?,?,?)',
      [userId, fromUserId, type, title, body, data ? JSON.stringify(data) : null]
    );
    
    // Get unread count
    const [count] = await db.execute('SELECT COUNT(*) as unread FROM notifications WHERE user_id=? AND is_read=FALSE', [userId]);
    
    // Emit to user via socket
    io.emit('new_notification', { 
      userId, 
      notification: { 
        id: result.insertId, 
        type, 
        title, 
        body, 
        data, 
        is_read: false, 
        created_at: new Date() 
      },
      unread_count: count[0].unread 
    });
  } catch (e) {
    console.error('Notification error:', e.message);
  }
}

// AUTH
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

// PROFILE
app.get('/api/profile/:userId', async (req,res) => {
  try {
    const { userId } = req.params;
    const [rows] = await db.execute('SELECT id, username, bio, avatar_url, points, created_at FROM users WHERE id=?', [userId]);
    if (!rows.length) return res.status(404).json({ error:'User not found' });
    const [stats] = await db.execute('SELECT COUNT(*) as total_activities, SUM(CASE WHEN completed=1 THEN 1 ELSE 0 END) as completed_count FROM activities WHERE user_id=?', [userId]);
    const [topType] = await db.execute('SELECT activity_type, COUNT(*) as count FROM activities WHERE user_id=? AND completed=1 GROUP BY activity_type ORDER BY count DESC LIMIT 1', [userId]);
    res.json({ ...rows[0], stats: { total_activities: stats[0]?.total_activities||0, completed_count: stats[0]?.completed_count||0, top_activity_type: topType[0]?.activity_type||null } });
  } catch(e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

app.put('/api/profile/:userId', async (req,res) => {
  try {
    const { userId } = req.params;
    const { bio } = req.body;
    await db.execute('UPDATE users SET bio=? WHERE id=?', [bio||'', userId]);
    res.json({ success:true });
  } catch { res.status(500).json({ error:'Failed' }); }
});

app.post('/api/profile/:userId/avatar', upload.single('avatar'), async (req,res) => {
  try {
    const { userId } = req.params;
    if (!req.file) return res.status(400).json({ error:'No file' });
    const avatarUrl = `/uploads/${req.file.filename}`;
    await db.execute('UPDATE users SET avatar_url=? WHERE id=?', [avatarUrl, userId]);
    res.json({ avatar_url: avatarUrl });
  } catch(e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

// ACTIVITIES
app.get('/api/activities', async (req,res) => {
  try {
    const [rows] = await db.execute('SELECT a.*,u.username AS creator_username FROM activities a JOIN users u ON a.user_id=u.id ORDER BY a.scheduled_time');
    res.json(rows);
  } catch { res.status(500).json({ error:'Failed' }); }
});

app.post('/api/activities', async (req,res) => {
  try {
    const { user_id, name, scheduled_time, activity_type, repeat_days } = req.body;
    const [r] = await db.execute('INSERT INTO activities (user_id,name,scheduled_time,activity_type,repeat_days) VALUES (?,?,?,?,?)', [user_id, name, scheduled_time, activity_type, repeat_days||'0123456']);
    const [rows] = await db.execute('SELECT a.*,u.username AS creator_username FROM activities a JOIN users u ON a.user_id=u.id WHERE a.id=?', [r.insertId]);
    const activity = rows[0];
    io.emit('activity_created', activity);
    
    // Notify partner
    const [partner] = await db.execute('SELECT id FROM users WHERE id!=? LIMIT 1', [user_id]);
    if (partner[0]) {
      await createNotification(
        partner[0].id,
        user_id,
        'activity_created',
        `${activity.creator_username} created "${name}"`,
        `Scheduled at ${scheduled_time.slice(0,5)}`,
        { activity_id: activity.id }
      );
    }
    
    res.status(201).json(activity);
  } catch { res.status(500).json({ error:'Failed' }); }
});

app.post('/api/activities/:id/complete', async (req,res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    const [users] = await db.execute('SELECT username FROM users WHERE id=?', [user_id]);
    const uname = users[0]?.username;
    const [act] = await db.execute('SELECT name FROM activities WHERE id=?', [id]);
    
    await db.execute('UPDATE activities SET completed=1,completed_by=?,completed_at=NOW() WHERE id=?', [uname,id]);
    await db.execute('UPDATE users SET points=points+10 WHERE id=?', [user_id]);
    await db.execute('INSERT INTO activity_completions (activity_id,user_id,points_earned) VALUES (?,?,10)', [id,user_id]);
    io.emit('activity_completed', { activity_id:id, user_id, username:uname });
    io.emit('points_updated', { user_id });
    
    // Notify partner
    const [partner] = await db.execute('SELECT id FROM users WHERE id!=? LIMIT 1', [user_id]);
    if (partner[0] && act[0]) {
      await createNotification(
        partner[0].id,
        user_id,
        'activity_completed',
        `${uname} completed "${act[0].name}"`,
        '+10 points earned',
        { activity_id: id }
      );
    }
    
    res.json({ success:true });
  } catch { res.status(500).json({ error:'Failed' }); }
});

app.delete('/api/activities/:id', async (req,res) => {
  try {
    await db.execute('DELETE FROM activities WHERE id=?', [req.params.id]);
    io.emit('activity_deleted', { id:req.params.id });
    res.json({ success:true });
  } catch { res.status(500).json({ error:'Failed' }); }
});

// POINTS
app.get('/api/points/:uid', async (req,res) => {
  try {
    const { uid } = req.params;
    const [mine] = await db.execute('SELECT points,username FROM users WHERE id=?', [uid]);
    const [other] = await db.execute('SELECT id,points,username FROM users WHERE id!=? LIMIT 1', [uid]);
    res.json({ user_points:mine[0]?.points??0, partner_points:other[0]?.points??0, partner_username:other[0]?.username??'Partner', partner_id:other[0]?.id??null });
  } catch { res.status(500).json({ error:'Failed' }); }
});

// MOMENTS
app.get('/api/moments', async (req,res) => {
  try {
    const [rows] = await db.execute('SELECT m.*,u.username FROM moments m JOIN users u ON m.user_id=u.id ORDER BY m.created_at LIMIT 100');
    res.json(rows);
  } catch { res.status(500).json({ error:'Failed' }); }
});

app.post('/api/moments', async (req,res) => {
  try {
    const { user_id, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error:'Text required' });
    const [r] = await db.execute('INSERT INTO moments (user_id,text) VALUES (?,?)', [user_id, text.trim()]);
    const [rows] = await db.execute('SELECT m.*,u.username FROM moments m JOIN users u ON m.user_id=u.id WHERE m.id=?', [r.insertId]);
    const moment = rows[0];
    io.emit('new_moment', moment);
    
    // Create notification for partner
    const [partner] = await db.execute('SELECT id FROM users WHERE id!=? LIMIT 1', [user_id]);
    if (partner[0]) {
      await createNotification(
        partner[0].id, 
        user_id, 
        'moment_shared', 
        `${moment.username} shared a moment`,
        text.trim().substring(0, 100),
        { moment_id: moment.id }
      );
    }
    
    res.status(201).json(moment);
  } catch { res.status(500).json({ error:'Failed' }); }
});

// NOTIFICATIONS
app.get('/api/notifications/:userId', async (req,res) => {
  try {
    const { userId } = req.params;
    const [rows] = await db.execute(`
      SELECT n.*, u.username as from_username 
      FROM notifications n 
      JOIN users u ON n.from_user_id = u.id 
      WHERE n.user_id=? 
      ORDER BY n.created_at DESC 
      LIMIT 50
    `, [userId]);
    res.json(rows);
  } catch { res.status(500).json({ error:'Failed' }); }
});

app.get('/api/notifications/:userId/unread-count', async (req,res) => {
  try {
    const { userId } = req.params;
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM notifications WHERE user_id=? AND is_read=FALSE', [userId]);
    res.json({ unread_count: rows[0].count });
  } catch { res.status(500).json({ error:'Failed' }); }
});

app.post('/api/notifications/:notificationId/read', async (req,res) => {
  try {
    const { notificationId } = req.params;
    await db.execute('UPDATE notifications SET is_read=TRUE WHERE id=?', [notificationId]);
    res.json({ success:true });
  } catch { res.status(500).json({ error:'Failed' }); }
});

app.post('/api/notifications/:userId/mark-all-read', async (req,res) => {
  try {
    const { userId } = req.params;
    await db.execute('UPDATE notifications SET is_read=TRUE WHERE user_id=?', [userId]);
    res.json({ success:true });
  } catch { res.status(500).json({ error:'Failed' }); }
});

// SOCKET.IO
io.on('connection', (socket) => {
  socket.on('user_online', ({ userId, username }) => {
    online.set(String(userId), { socketId:socket.id, username });
    socket.broadcast.emit('user_joined', { userId, username });
    broadcast();
    console.log(`✅ ${username} online`);
  });
  socket.on('send_vibration', (d) => socket.broadcast.emit('receive_vibration', d));
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

// CRON
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const wd = String(now.getDay());
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:00`;
    const [due] = await db.execute('SELECT * FROM activities WHERE scheduled_time=? AND completed=0 AND repeat_days LIKE ?', [time, `%${wd}%`]);
    for (const a of due) io.emit('activity_reminder', { id:a.id, name:a.name, activity_type:a.activity_type });
    if (time === '00:00:00') {
      await db.execute('UPDATE activities SET completed=0,completed_by=NULL WHERE 1=1');
      console.log('🔄 Reset');
    }
  } catch(e) { console.error('cron:', e.message); }
});

const PORT = process.env.PORT || 3000;
srv.listen(PORT, '0.0.0.0', () => console.log(`
╔═══════════════════════════════════╗
║  🚀 Server v7  —  port ${PORT}       ║
║  👤 Profile + Images active       ║
╚═══════════════════════════════════╝`));
