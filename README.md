# Shared Activity v8 — Notifications System

✅ **Full notifications system**  
✅ **Unread count badge** on home screen  
✅ **Partner activity tracking**  
✅ **Click to navigate** (moments → moments screen)  
✅ **SDK 54 + Node 20**  

---

## 🆕 What's New in v8

### 🔔 Notifications Screen
- See all partner actions in one place
- Types of notifications:
  - 🎯 **Activity Created** — when partner creates new activity
  - ✅ **Activity Completed** — when partner finishes activity
  - 💬 **Moment Shared** — when partner shares a moment (tap to open)
  - 📳 **Vibration Sent** — when partner sends buzz

### 🔴 Unread Count Badge
- Red badge on notification bell in home header
- Shows count of unread notifications (e.g., "3")
- Updates in real-time via Socket.IO
- Disappears when all read

### ✨ Smart Navigation
- Tap "Moment Shared" notification → opens Moments screen
- Automatically marks as read when tapped
- "Mark all read" button when you have unread items

---

## 📋 Installation

### Requirements
- **Node.js 20+**
- MySQL 8+

```bash
# 1. Node 20
node --version  # MUST be v20.x.x

# 2. Database
mysql -u root -p < server/database/init.sql

# 3. Configure
# server/.env → MySQL password
# src/config.js → LOCAL_IP

# 4. Clean install
rm -rf node_modules package-lock.json .expo
npm install

# 5. Server
cd server && npm install && npm start

# 6. App (new terminal)
npm start
```

---

## 🎯 How It Works

### Creating Notifications
Partner creates activity → You get notification:
- **Title**: "Alex created 'Morning Walk'"
- **Body**: "Scheduled at 08:00"
- **Unread badge**: Shows in header

### Completing Activities
Partner completes activity → You get notification:
- **Title**: "Alex completed 'Morning Walk'"
- **Body**: "+10 points earned"

### Sharing Moments
Partner shares moment → You get notification:
- **Title**: "Alex shared a moment"
- **Body**: First 100 chars of the message
- **Tap**: Opens Moments screen
- **Unread badge**: Updates in real-time

---

## 📊 Database

New `notifications` table:
- `user_id` — who receives notification
- `from_user_id` — who triggered it
- `type` — activity_created, activity_completed, moment_shared, vibration_sent
- `title` — notification heading
- `body` — notification message
- `data` — JSON with extra info (e.g., moment_id)
- `is_read` — boolean flag
- `created_at` — timestamp

---

## 🔧 Features

### Notifications
- ✅ Activity created by partner
- ✅ Activity completed by partner
- ✅ Moment shared by partner
- ✅ Vibration sent by partner
- ✅ Real-time updates via Socket.IO
- ✅ Unread count badge
- ✅ Mark individual as read
- ✅ Mark all as read button
- ✅ Navigate to moments on tap

### Previous Features
- 👤 Profile with avatar
- 📅 Calendar long-press create
- 💬 Shared moments
- 📳 Send vibrations
- 🌙 Dark mode
- 🟢 Online status
- 📊 Activity stats

---

## Test Accounts
- user1 / password123
- user2 / password123

Test flow:
1. Login as user1
2. Create activity
3. Login as user2 → see notification with badge
4. Tap notification → marked as read
5. Badge disappears

---

Built with ❤️ — v8 Notifications
