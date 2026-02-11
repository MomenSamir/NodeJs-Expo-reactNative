# 📱 Shared Activity App — Complete Install Guide
### Expo (React Native) + Node.js + MySQL

---

## What You Need (Prerequisites)

| Tool | Download |
|------|----------|
| Node.js 18+ | https://nodejs.org |
| MySQL 8+ | https://dev.mysql.com/downloads/ |
| Expo Go app | Install on your phone from App Store / Play Store |

> ✅ No Android Studio. No Java. No Gradle. Just Node.js!

---

## STEP 1 — Find Your Computer's IP Address

Your phone connects to your PC via WiFi. You need your local IP.

**Linux/Mac:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
# Look for something like: 192.168.1.100
```

**Windows:**
```cmd
ipconfig
# Look for IPv4 Address under your WiFi adapter
```

📌 Write down your IP — you'll use it in Step 4.

---

## STEP 2 — Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Run these commands:
CREATE DATABASE shared_activity_db;
USE shared_activity_db;
```

Then copy-paste the contents of `server/database/init.sql` OR run:
```bash
mysql -u root -p shared_activity_db < server/database/init.sql
```

**Verify it worked:**
```sql
USE shared_activity_db;
SHOW TABLES;
-- Should show: users, activities, activity_completions
SELECT username FROM users;
-- Should show: user1, user2
```

---

## STEP 3 — Start the Backend Server

```bash
# Go into server folder
cd server

# Install dependencies
npm install

# Edit .env file with your MySQL password
nano .env        # Linux/Mac
notepad .env     # Windows
```

Edit `.env` to look like this:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD    ← change this
DB_NAME=shared_activity_db
```

```bash
# Start the server
npm start
```

✅ You should see:
```
✅ MySQL connected
╔═══════════════════════════════════════╗
║  🚀 Server running on port 3000       ║
╚═══════════════════════════════════════╝
```

**Test it works:**
Open browser and go to:  http://localhost:3000/api/activities
Should show: `[]`  (empty array = working!)

---

## STEP 4 — Configure the Mobile App IP

Open this file in a text editor:
```
src/config.js
```

Find line 10:
```javascript
const LOCAL_IP = '192.168.1.100'; // <-- CHANGE THIS TO YOUR IP
```

Replace `192.168.1.100` with YOUR actual IP from Step 1.

Example:
```javascript
const LOCAL_IP = '192.168.1.55';   // ← your real IP
```

---

## STEP 5 — Install & Run the Expo App

```bash
# Make sure you're in the root folder (not server/)
cd ..   # if you were in server/

# Install Expo CLI globally (only once)
npm install -g expo-cli

# Install app dependencies
npm install

# Start Expo
npx expo start
```

You'll see a **QR code** in the terminal.

---

## STEP 6 — Open on Your Phone

1. Make sure your phone is on the **same WiFi** as your computer
2. Open the **Expo Go** app on your phone
3. **Android:** Tap "Scan QR code" and scan the QR in terminal
4. **iOS:** Open Camera app and scan the QR code

The app will load on your phone! 🎉

---

## STEP 7 — Test With Two Users

**On your phone:**
- Login with `user1` / `password123`

**On another phone OR browser (http://YOUR_IP:3000):**
- Login with `user2` / `password123`

**Test real-time:**
1. On User1: Tap ➕, create activity "Test Water", set time 1-2 minutes from now
2. On User2: See activity appear instantly
3. Wait for the time → both get notified
4. Complete it → both see update + points!

---

## Project Structure

```
shared-activity-app/
│
├── App.js                          ← Main entry point
├── app.json                        ← Expo config
├── package.json                    ← App dependencies
│
├── src/
│   ├── config.js                   ← ⚠️ SET YOUR IP HERE
│   ├── context/
│   │   └── AuthContext.js          ← User session state
│   ├── services/
│   │   ├── api.js                  ← HTTP API calls
│   │   ├── socket.js               ← Socket.IO client
│   │   └── notifications.js        ← Expo notifications
│   └── screens/
│       ├── LoginScreen.js          ← Login / Register
│       ├── HomeScreen.js           ← Activity list + points
│       └── AddActivityScreen.js    ← Create new activity
│
└── server/
    ├── server.js                   ← Node.js + Express + Socket.IO
    ├── package.json
    ├── .env                        ← ⚠️ SET YOUR DB PASSWORD HERE
    ├── config/
    │   └── database.js             ← MySQL connection
    └── database/
        └── init.sql                ← DB schema + test users
```

---

## Troubleshooting

### ❌ "Network request failed" on phone
- Check IP in `src/config.js` matches your computer's IP
- Make sure phone and PC are on same WiFi
- Make sure server is running (`npm start` in `/server`)
- Try pinging from phone: open browser on phone → `http://YOUR_IP:3000/api/activities`

### ❌ "MySQL connection failed"
- Check MySQL is running: `sudo systemctl status mysql`
- Check password in `server/.env`
- Check database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### ❌ "Module not found" in Expo
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### ❌ Expo QR not working
```bash
# Try tunnel mode (works even without same WiFi)
npx expo start --tunnel
```

### ❌ Notifications not showing
- On Android: Expo Go handles this automatically
- On iOS: Must accept permissions when app asks
- Notifications only show when app is in foreground OR background (not closed)

### ❌ Server port 3000 in use
```bash
# Find and kill the process
lsof -i :3000       # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Or change port in server/.env
PORT=3001
# And update src/config.js:
export const API_BASE_URL = `http://${LOCAL_IP}:3001/api`;
export const SOCKET_URL = `http://${LOCAL_IP}:3001`;
```

---

## Default Test Accounts

| Username | Password |
|----------|----------|
| user1 | password123 |
| user2 | password123 |

Or create your own by tapping "Register" on the login screen.

---

## Activity Types & Notifications

| Type | Haptic | Icon |
|------|--------|------|
| Alarm | Strong double buzz | 🔴 |
| Drink Water | Gentle success | 🔵 |
| Exercise | Medium warning | 🟡 |
| Reminder | Light success | 🟣 |
| Medication | Light success | 🟢 |
| Break | Light success | ⚫ |

---

## How Points Work

- Complete any activity = **+10 points**
- Points shown on home screen for both users
- Updates in real-time via Socket.IO

---

## Quick Command Reference

```bash
# Start server
cd server && npm start

# Start Expo app
npx expo start

# Open on Android emulator (if installed)
npx expo start --android

# Open in web browser
npx expo start --web

# Clear cache and restart
npx expo start --clear
```

---

## Running Both at Once (Linux/Mac)

```bash
# Terminal 1 — server
cd server && npm start

# Terminal 2 — expo
cd .. && npx expo start
```

That's it! Enjoy your real-time shared activity tracker 🎉
