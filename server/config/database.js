const mysql = require('mysql2/promise');
require('dotenv').config();
const pool = mysql.createPool({
  host: process.env.DB_HOST||'localhost', user: process.env.DB_USER||'root',
  password: process.env.DB_PASSWORD||'', database: process.env.DB_NAME||'shared_activity_db',
  waitForConnections:true, connectionLimit:10,
});
pool.getConnection().then(c=>{console.log('✅ MySQL connected');c.release();}).catch(e=>console.error('❌',e.message));
module.exports = pool;
