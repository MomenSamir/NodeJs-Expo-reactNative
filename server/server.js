const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');
const cron = require('node-cron');
require('dotenv').config();

const db = require('./config/database');
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'DELETE'] }
});

app.use(cors());
app.use(express.json());

// Track connected users: userId -> socketId
const connectedUsers = new Map();

// ─────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed]
    );
    res.status(201).json({ user_id: result.insertId, username });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ user_id: rows[0].id, username: rows[0].username, points: rows[0].points });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─────────────────────────────────────────────
//  ACTIVITIES
// ─────────────────────────────────────────────

app.get('/api/activities', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.*, u.username AS creator_username
      FROM activities a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.scheduled_time ASC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load activities' });
  }
});

app.post('/api/activities', async (req, res) => {
  try {
    const { user_id, name, scheduled_time, activity_type } = req.body;
    const [result] = await db.execute(
      'INSERT INTO activities (user_id, name, scheduled_time, activity_type) VALUES (?, ?, ?, ?)',
      [user_id, name, scheduled_time, activity_type]
    );
    const [rows] = await db.execute(
      'SELECT a.*, u.username AS creator_username FROM activities a JOIN users u ON a.user_id = u.id WHERE a.id = ?',
      [result.insertId]
    );
    io.emit('activity_created', rows[0]);
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

app.post('/api/activities/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const [users] = await db.execute('SELECT username FROM users WHERE id = ?', [user_id]);
    const username = users[0]?.username;

    await db.execute(
      'UPDATE activities SET completed = TRUE, completed_by = ?, completed_at = NOW() WHERE id = ?',
      [username, id]
    );
    await db.execute('UPDATE users SET points = points + 10 WHERE id = ?', [user_id]);
    await db.execute(
      'INSERT INTO activity_completions (activity_id, user_id, points_earned) VALUES (?, ?, 10)',
      [id, user_id]
    );

    const [acts] = await db.execute('SELECT * FROM activities WHERE id = ?', [id]);

    io.emit('activity_completed', {
      activity_id: id,
      activity_name: acts[0].name,
      user_id,
      username,
      points: 10,
    });
    io.emit('points_updated', { user_id });

    res.json({ success: true, points_earned: 10 });
  } catch (e) {
    res.status(500).json({ error: 'Failed to complete activity' });
  }
});

app.delete('/api/activities/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM activities WHERE id = ?', [req.params.id]);
    io.emit('activity_created'); // reuse to trigger reload
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// ─────────────────────────────────────────────
//  POINTS
// ─────────────────────────────────────────────

app.get('/api/points/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [mine] = await db.execute('SELECT points FROM users WHERE id = ?', [userId]);
    const [other] = await db.execute('SELECT points FROM users WHERE id != ? LIMIT 1', [userId]);
    res.json({
      user_points: mine[0]?.points ?? 0,
      partner_points: other[0]?.points ?? 0,
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get points' });
  }
});

// ─────────────────────────────────────────────
//  SOCKET.IO
// ─────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('register', ({ userId }) => {
    connectedUsers.set(String(userId), socket.id);
    console.log(`👤 User ${userId} registered`);
  });

  socket.on('complete_activity', async ({ activityId, userId }) => {
    try {
      const [users] = await db.execute('SELECT username FROM users WHERE id = ?', [userId]);
      const username = users[0]?.username;

      await db.execute(
        'UPDATE activities SET completed = TRUE, completed_by = ?, completed_at = NOW() WHERE id = ?',
        [username, activityId]
      );
      await db.execute('UPDATE users SET points = points + 10 WHERE id = ?', [userId]);

      const [acts] = await db.execute('SELECT * FROM activities WHERE id = ?', [activityId]);
      io.emit('activity_completed', { activity_id: activityId, activity_name: acts[0]?.name, userId, username });
      io.emit('points_updated', { userId });
    } catch (e) {
      console.error('Socket complete error:', e.message);
    }
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of connectedUsers) {
      if (sid === socket.id) { connectedUsers.delete(uid); break; }
    }
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ─────────────────────────────────────────────
//  CRON: Check every minute for due activities
// ─────────────────────────────────────────────

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:00`;

    const [due] = await db.execute(
      'SELECT * FROM activities WHERE scheduled_time = ? AND completed = FALSE', [time]
    );

    for (const act of due) {
      console.log(`⏰ Reminder: ${act.name} at ${time}`);
      io.emit('activity_reminder', {
        id: act.id,
        name: act.name,
        scheduled_time: act.scheduled_time,
        activity_type: act.activity_type,
        user_id: act.user_id,
      });
    }
  } catch (e) {
    console.error('Cron error:', e.message);
  }
});

// ─────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════╗
║  🚀 Server running on port ${PORT}       ║
║  📱 Phone can connect via LAN IP       ║
║  🔄 Socket.IO enabled                  ║
║  ⏰ Activity cron job active           ║
╚═══════════════════════════════════════╝
  `);
});
