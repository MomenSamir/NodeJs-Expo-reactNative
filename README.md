# Shared Activity — SDK 53 (STABLE)

⚠️ **SDK 54 has native module bugs. This version uses SDK 53 which is stable.**

## Requirements
- **Node.js 20+** (check: `node --version`)
- MySQL 8+
- Expo Go app on phone

## Install Node 20
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
```

## Setup

1. **Database**
```bash
mysql -u root -p < server/database/init.sql
```

2. **Configure**
- Edit `server/.env` → set MySQL password
- Edit `src/config.js` → set your LOCAL_IP

3. **Start**
```bash
# Terminal 1 — server
cd server && npm install && npm start

# Terminal 2 — app
npm install
npm start
```

Scan QR with Expo Go → Done!

## If you get "TurboModule" error:
```bash
rm -rf node_modules .expo package-lock.json
npm install
npx expo start --clear --tunnel
```

## Test accounts
- user1 / password123
- user2 / password123
